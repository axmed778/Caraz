import {
  Controller, Post, Delete, Put, Param, UseGuards,
  UseInterceptors, UploadedFiles, ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { ImagesService } from './images.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Images')
@Controller('listings')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ImagesController {
  constructor(private imagesService: ImagesService) {}

  @Post(':id/images')
  @ApiOperation({ summary: 'Upload images to a listing (max 20)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 20, { storage: memoryStorage() }))
  async upload(
    @Param('id', ParseUUIDPipe) listingId: string,
    @CurrentUser('id') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return { data: await this.imagesService.uploadListingImages(listingId, userId, files) };
  }

  @Delete(':listingId/images/:imageId')
  @ApiOperation({ summary: 'Delete an image' })
  async deleteImage(
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.imagesService.deleteImage(imageId, userId);
  }

  @Put(':listingId/images/:imageId/cover')
  @ApiOperation({ summary: 'Set image as cover photo' })
  async setCover(
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.imagesService.setCoverImage(imageId, userId);
  }
}
