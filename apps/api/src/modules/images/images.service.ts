import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { PrismaService } from '../../prisma/prisma.service';
import { randomUUID } from 'crypto';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGES_PER_LISTING = 20;

@Injectable()
export class ImagesService {
  private r2: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.bucketName = config.getOrThrow('R2_BUCKET_NAME');
    this.publicUrl = config.getOrThrow('R2_PUBLIC_URL');

    this.r2 = new S3Client({
      region: 'auto',
      endpoint: `https://${config.getOrThrow('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.getOrThrow('R2_ACCESS_KEY_ID'),
        secretAccessKey: config.getOrThrow('R2_SECRET_ACCESS_KEY'),
      },
    });
  }

  async uploadListingImages(
    listingId: string,
    userId: string,
    files: Express.Multer.File[],
  ) {
    // Verify listing ownership
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { _count: { select: { images: true } } },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.userId !== userId) throw new ForbiddenException('Not your listing');

    const currentCount = listing._count.images;
    if (currentCount + files.length > MAX_IMAGES_PER_LISTING) {
      throw new BadRequestException(`Maximum ${MAX_IMAGES_PER_LISTING} images per listing`);
    }

    const results = [];
    const isFirstBatch = currentCount === 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.validateFile(file);

      const imageId = randomUUID();
      const ext = this.getExtension(file.mimetype);
      const key = `listings/${listingId}/${imageId}${ext}`;

      await this.r2.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'public, max-age=31536000',
      }));

      const urlOriginal = `${this.publicUrl}/${key}`;
      const isCover = isFirstBatch && i === 0;

      const image = await this.prisma.listingImage.create({
        data: {
          listingId,
          urlOriginal,
          // Cloudflare Image Resizing via URL transforms (free with R2)
          urlThumb: `${this.publicUrl}/cdn-cgi/image/width=300,height=225,fit=cover,format=webp,quality=75/${key}`,
          urlMedium: `${this.publicUrl}/cdn-cgi/image/width=800,height=600,fit=contain,format=webp,quality=80/${key}`,
          urlLarge: `${this.publicUrl}/cdn-cgi/image/width=1600,height=1200,fit=contain,format=webp,quality=85/${key}`,
          sortOrder: currentCount + i,
          isCover,
        },
      });

      results.push(image);
    }

    return results;
  }

  async deleteImage(imageId: string, userId: string) {
    const image = await this.prisma.listingImage.findUnique({
      where: { id: imageId },
      include: { listing: { select: { userId: true } } },
    });
    if (!image) throw new NotFoundException('Image not found');
    if (image.listing.userId !== userId) throw new ForbiddenException('Not your listing');

    // Extract R2 key from URL
    const key = image.urlOriginal.replace(`${this.publicUrl}/`, '');
    await this.r2.send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: key }));
    await this.prisma.listingImage.delete({ where: { id: imageId } });

    // If deleted image was cover, promote next image
    if (image.isCover) {
      const nextImage = await this.prisma.listingImage.findFirst({
        where: { listingId: image.listingId },
        orderBy: { sortOrder: 'asc' },
      });
      if (nextImage) {
        await this.prisma.listingImage.update({
          where: { id: nextImage.id },
          data: { isCover: true },
        });
      }
    }

    return { message: 'Image deleted' };
  }

  async setCoverImage(imageId: string, userId: string) {
    const image = await this.prisma.listingImage.findUnique({
      where: { id: imageId },
      include: { listing: { select: { userId: true, id: true } } },
    });
    if (!image) throw new NotFoundException('Image not found');
    if (image.listing.userId !== userId) throw new ForbiddenException('Not your listing');

    // Clear existing cover, set new one
    await this.prisma.$transaction([
      this.prisma.listingImage.updateMany({
        where: { listingId: image.listingId },
        data: { isCover: false },
      }),
      this.prisma.listingImage.update({
        where: { id: imageId },
        data: { isCover: true },
      }),
    ]);

    return { message: 'Cover image updated' };
  }

  private validateFile(file: Express.Multer.File) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, WebP images are allowed');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File size cannot exceed 10MB');
    }
    // Magic bytes validation (first 4 bytes)
    const buf = file.buffer;
    const isJpeg = buf[0] === 0xFF && buf[1] === 0xD8;
    const isPng  = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
    const isWebp = buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;
    if (!isJpeg && !isPng && !isWebp) {
      throw new BadRequestException('Invalid image file');
    }
  }

  private getExtension(mimeType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };
    return map[mimeType] || '.jpg';
  }
}
