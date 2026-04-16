import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Cities ───────────────────────────────────────────
  const cities = await Promise.all([
    prisma.city.upsert({ where: { id: 1 }, update: {}, create: { id: 1, name: 'Baku', nameAz: 'Bakı', region: 'Absheron' } }),
    prisma.city.upsert({ where: { id: 2 }, update: {}, create: { id: 2, name: 'Sumgait', nameAz: 'Sumqayıt', region: 'Absheron' } }),
    prisma.city.upsert({ where: { id: 3 }, update: {}, create: { id: 3, name: 'Ganja', nameAz: 'Gəncə', region: 'Ganja-Gazakh' } }),
    prisma.city.upsert({ where: { id: 4 }, update: {}, create: { id: 4, name: 'Mingachevir', nameAz: 'Mingəçevir', region: 'Aran' } }),
    prisma.city.upsert({ where: { id: 5 }, update: {}, create: { id: 5, name: 'Lankaran', nameAz: 'Lənkəran', region: 'Lankaran' } }),
    prisma.city.upsert({ where: { id: 6 }, update: {}, create: { id: 6, name: 'Sheki', nameAz: 'Şəki', region: 'Sheki-Zagatala' } }),
    prisma.city.upsert({ where: { id: 7 }, update: {}, create: { id: 7, name: 'Shirvan', nameAz: 'Şirvan', region: 'Aran' } }),
    prisma.city.upsert({ where: { id: 8 }, update: {}, create: { id: 8, name: 'Yevlakh', nameAz: 'Yevlax', region: 'Aran' } }),
    prisma.city.upsert({ where: { id: 9 }, update: {}, create: { id: 9, name: 'Nakhchivan', nameAz: 'Naxçıvan', region: 'Nakhchivan' } }),
    prisma.city.upsert({ where: { id: 10 }, update: {}, create: { id: 10, name: 'Khirdalan', nameAz: 'Xırdalan', region: 'Absheron' } }),
    prisma.city.upsert({ where: { id: 11 }, update: {}, create: { id: 11, name: 'Gabala', nameAz: 'Qəbələ', region: 'Sheki-Zagatala' } }),
    prisma.city.upsert({ where: { id: 12 }, update: {}, create: { id: 12, name: 'Guba', nameAz: 'Quba', region: 'Guba-Khachmaz' } }),
    prisma.city.upsert({ where: { id: 13 }, update: {}, create: { id: 13, name: 'Barda', nameAz: 'Bərdə', region: 'Aran' } }),
    prisma.city.upsert({ where: { id: 14 }, update: {}, create: { id: 14, name: 'Shamakhi', nameAz: 'Şamaxı', region: 'Aran' } }),
    prisma.city.upsert({ where: { id: 15 }, update: {}, create: { id: 15, name: 'Zagatala', nameAz: 'Zaqatala', region: 'Sheki-Zagatala' } }),
  ]);
  console.log(`Seeded ${cities.length} cities`);

  // ─── Colors ───────────────────────────────────────────
  const colors = await Promise.all([
    prisma.color.upsert({ where: { id: 1 }, update: {}, create: { id: 1, name: 'Black', nameAz: 'Qara', hexCode: '#000000' } }),
    prisma.color.upsert({ where: { id: 2 }, update: {}, create: { id: 2, name: 'White', nameAz: 'Ağ', hexCode: '#FFFFFF' } }),
    prisma.color.upsert({ where: { id: 3 }, update: {}, create: { id: 3, name: 'Silver', nameAz: 'Gümüşü', hexCode: '#C0C0C0' } }),
    prisma.color.upsert({ where: { id: 4 }, update: {}, create: { id: 4, name: 'Gray', nameAz: 'Boz', hexCode: '#808080' } }),
    prisma.color.upsert({ where: { id: 5 }, update: {}, create: { id: 5, name: 'Red', nameAz: 'Qırmızı', hexCode: '#FF0000' } }),
    prisma.color.upsert({ where: { id: 6 }, update: {}, create: { id: 6, name: 'Blue', nameAz: 'Göy', hexCode: '#0000FF' } }),
    prisma.color.upsert({ where: { id: 7 }, update: {}, create: { id: 7, name: 'Green', nameAz: 'Yaşıl', hexCode: '#008000' } }),
    prisma.color.upsert({ where: { id: 8 }, update: {}, create: { id: 8, name: 'Brown', nameAz: 'Qəhvəyi', hexCode: '#8B4513' } }),
    prisma.color.upsert({ where: { id: 9 }, update: {}, create: { id: 9, name: 'Beige', nameAz: 'Bej', hexCode: '#F5F5DC' } }),
    prisma.color.upsert({ where: { id: 10 }, update: {}, create: { id: 10, name: 'Gold', nameAz: 'Qızılı', hexCode: '#FFD700' } }),
    prisma.color.upsert({ where: { id: 11 }, update: {}, create: { id: 11, name: 'Orange', nameAz: 'Narıncı', hexCode: '#FFA500' } }),
    prisma.color.upsert({ where: { id: 12 }, update: {}, create: { id: 12, name: 'Yellow', nameAz: 'Sarı', hexCode: '#FFFF00' } }),
    prisma.color.upsert({ where: { id: 13 }, update: {}, create: { id: 13, name: 'Purple', nameAz: 'Bənövşəyi', hexCode: '#800080' } }),
  ]);
  console.log(`Seeded ${colors.length} colors`);

  // ─── Brands & Models (top brands in AZ market) ────────
  const brandData = [
    { name: 'Mercedes-Benz', slug: 'mercedes-benz', models: ['C-Class', 'E-Class', 'S-Class', 'GLE', 'GLC', 'A-Class', 'CLA', 'GLA', 'GLB', 'G-Class', 'CLS', 'GLS', 'ML', 'Sprinter', 'Vito'] },
    { name: 'BMW', slug: 'bmw', models: ['3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X6', 'X7', '1 Series', '4 Series', '2 Series', 'M3', 'M5', 'i3', 'i8'] },
    { name: 'Toyota', slug: 'toyota', models: ['Camry', 'Corolla', 'RAV4', 'Land Cruiser', 'Prius', 'Highlander', 'C-HR', 'Yaris', 'Avalon', 'Prado', '4Runner', 'Tacoma', 'Hilux'] },
    { name: 'Hyundai', slug: 'hyundai', models: ['Sonata', 'Elantra', 'Tucson', 'Santa Fe', 'Accent', 'i10', 'i20', 'i30', 'ix35', 'Creta', 'Palisade', 'Kona', 'Venue'] },
    { name: 'Kia', slug: 'kia', models: ['Sportage', 'Optima', 'Cerato', 'Rio', 'Sorento', 'Seltos', 'Soul', 'Stinger', 'K5', 'Carnival', 'Picanto', 'Ceed'] },
    { name: 'Lexus', slug: 'lexus', models: ['RX', 'ES', 'LX', 'NX', 'IS', 'GX', 'LS', 'UX', 'LC', 'RC'] },
    { name: 'Nissan', slug: 'nissan', models: ['Qashqai', 'X-Trail', 'Juke', 'Altima', 'Patrol', 'Pathfinder', 'Note', 'Tiida', 'Maxima', 'Murano', 'Sentra'] },
    { name: 'Chevrolet', slug: 'chevrolet', models: ['Malibu', 'Cruze', 'Spark', 'Equinox', 'Tahoe', 'Camaro', 'Cobalt', 'Lacetti', 'Captiva', 'Aveo', 'Tracker', 'Trailblazer'] },
    { name: 'Volkswagen', slug: 'volkswagen', models: ['Golf', 'Passat', 'Tiguan', 'Polo', 'Jetta', 'Touareg', 'Arteon', 'T-Roc', 'Atlas', 'ID.4', 'Caddy', 'Transporter'] },
    { name: 'Audi', slug: 'audi', models: ['A4', 'A6', 'A3', 'Q5', 'Q7', 'A8', 'Q3', 'Q8', 'A5', 'TT', 'e-tron', 'RS6'] },
    { name: 'Ford', slug: 'ford', models: ['Focus', 'Fusion', 'Mustang', 'Explorer', 'Escape', 'Kuga', 'Fiesta', 'F-150', 'Ranger', 'Edge', 'Mondeo', 'Transit'] },
    { name: 'Honda', slug: 'honda', models: ['Civic', 'Accord', 'CR-V', 'HR-V', 'Fit', 'Pilot', 'City', 'Odyssey'] },
    { name: 'Mitsubishi', slug: 'mitsubishi', models: ['Outlander', 'Pajero', 'Lancer', 'Eclipse Cross', 'ASX', 'L200', 'Pajero Sport'] },
    { name: 'Mazda', slug: 'mazda', models: ['CX-5', 'Mazda3', 'Mazda6', 'CX-3', 'CX-9', 'CX-30', 'MX-5'] },
    { name: 'Subaru', slug: 'subaru', models: ['Forester', 'Outback', 'Impreza', 'XV', 'Legacy', 'WRX', 'BRZ'] },
    { name: 'Peugeot', slug: 'peugeot', models: ['206', '207', '208', '301', '308', '3008', '508', '2008', '5008'] },
    { name: 'Renault', slug: 'renault', models: ['Logan', 'Duster', 'Sandero', 'Megane', 'Fluence', 'Clio', 'Symbol', 'Captur'] },
    { name: 'Lada', slug: 'lada', models: ['Vesta', 'Granta', 'XRAY', 'Niva', 'Largus', 'Priora', '2107', '2114', '2110'] },
    { name: 'Land Rover', slug: 'land-rover', models: ['Range Rover', 'Range Rover Sport', 'Discovery', 'Freelander', 'Defender', 'Evoque', 'Velar'] },
    { name: 'Porsche', slug: 'porsche', models: ['Cayenne', 'Macan', 'Panamera', '911', 'Taycan', 'Boxster', 'Cayman'] },
    { name: 'Volvo', slug: 'volvo', models: ['XC90', 'XC60', 'S60', 'S90', 'V60', 'XC40', 'V90'] },
    { name: 'Skoda', slug: 'skoda', models: ['Octavia', 'Superb', 'Kodiaq', 'Karoq', 'Rapid', 'Fabia', 'Kamiq'] },
    { name: 'Infiniti', slug: 'infiniti', models: ['FX35', 'FX37', 'QX50', 'QX60', 'QX70', 'QX80', 'Q50', 'Q60'] },
    { name: 'Jeep', slug: 'jeep', models: ['Grand Cherokee', 'Cherokee', 'Wrangler', 'Compass', 'Renegade'] },
    { name: 'Daewoo', slug: 'daewoo', models: ['Matiz', 'Nexia', 'Gentra', 'Lacetti', 'Nubira', 'Leganza'] },
    { name: 'Opel', slug: 'opel', models: ['Astra', 'Corsa', 'Insignia', 'Mokka', 'Zafira', 'Vectra', 'Meriva'] },
    { name: 'Fiat', slug: 'fiat', models: ['500', 'Punto', 'Tipo', 'Panda', 'Doblo', 'Linea'] },
    { name: 'Citroen', slug: 'citroen', models: ['C3', 'C4', 'C5', 'C-Elysee', 'Berlingo', 'C3 Aircross'] },
    { name: 'Tesla', slug: 'tesla', models: ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck'] },
    { name: 'BYD', slug: 'byd', models: ['Han', 'Tang', 'Song', 'Seal', 'Atto 3', 'Dolphin'] },
    { name: 'Geely', slug: 'geely', models: ['Atlas', 'Coolray', 'Tugella', 'Emgrand', 'Monjaro'] },
    { name: 'Chery', slug: 'chery', models: ['Tiggo 4', 'Tiggo 7', 'Tiggo 8', 'Arrizo 5', 'Arrizo 6'] },
    { name: 'GAZ', slug: 'gaz', models: ['Gazelle', 'Sobol', 'Next'] },
    { name: 'VAZ', slug: 'vaz', models: ['2101', '2106', '2107', '2109', '2110', '2112', '2114', '2115', 'Niva'] },
  ];

  let modelCount = 0;
  for (const b of brandData) {
    const brand = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: {},
      create: { name: b.name, slug: b.slug },
    });

    for (const modelName of b.models) {
      const modelSlug = modelName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      await prisma.model.upsert({
        where: { brandId_slug: { brandId: brand.id, slug: modelSlug } },
        update: {},
        create: { brandId: brand.id, name: modelName, slug: modelSlug },
      });
      modelCount++;
    }
  }
  console.log(`Seeded ${brandData.length} brands, ${modelCount} models`);

  console.log('Seeding complete!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
