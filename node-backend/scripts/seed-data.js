const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Hash admin password
    const adminPassword = 'Admin@12345';
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    const admin = await prisma.user.upsert({
        where: { email: 'admin@node.local' },
        update: {
            password: passwordHash,
            isStaff: true,
            isSuperuser: true,
            isActive: true,
            isSuspended: false,
        },
        create: {
            email: 'admin@node.local',
            username: 'admin@node.local',
            password: passwordHash,
            firstName: 'Node',
            lastName: 'Admin',
            isStaff: true,
            isSuperuser: true,
            isActive: true,
            isSuspended: false,
        },
    });

    // Create categories
    const categoryNames = [
        'Sneakers', 'Heels', 'Boots', 'Sandals', 'Flats',
        'Loafers', 'Slippers', 'Sneaker Boots', 'Ankle Boots', 'Mules'
    ];

    const categories = [];
    for (const name of categoryNames) {
        const category = await prisma.category.upsert({
            where: { name },
            update: {},
            create: {
                name,
                description: faker.lorem.sentence(),
                image: `/uploads/${faker.image.url()}`,
                sortOrder: faker.number.int({ min: 0, max: 100 }),
                isActive: true,
            },
        });
        categories.push(category);
    }

    // Create brands
    const brandNames = [
        'Nike', 'Adidas', 'Puma', 'Reebok', 'New Balance',
        'Converse', 'Vans', 'Jordan', 'Fila', 'Under Armour'
    ];

    const brands = [];
    for (const name of brandNames) {
        const brand = await prisma.brand.upsert({
            where: { name },
            update: {},
            create: {
                name,
                slug: name.toLowerCase(),
                description: faker.lorem.sentence(),
                isActive: true,
            },
        });
        brands.push(brand);
    }

    // Create products
    const productNames = [
        'Classic Leather Sneaker', 'Stiletto Heels', 'Ankle Boots', 'Flip Flops',
        'Comfort Flats', 'Loafer Shoes', 'Slippers', 'Platform Sneakers',
        'Mule Sandals', 'Winter Boots'
    ];

    const genders = ['Men', 'Women', 'Unisex'];
    const colors = ['Black', 'White', 'Brown', 'Red', 'Blue', 'Gold', 'Silver'];

    for (let i = 0; i < 30; i++) {
        const category = faker.helpers.arrayElement(categories);
        const brand = faker.helpers.arrayElement(brands);
        const gender = faker.helpers.arrayElement(genders);
        const color = faker.helpers.arrayElement(colors);
        const price = faker.number.int({ min: 2000, max: 15000 });

        const product = await prisma.product.create({
            data: {
                name: productNames[i] || faker.commerce.productName(),
                slug: `${(productNames[i] || faker.commerce.productName()).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${faker.number.int({ min: 1000, max: 9999 })}`,
                description: faker.lorem.sentence(),
                price,
                comparePrice: price + faker.number.int({ min: 1000, max: 5000 }),
                retailPrice: price,
                stock: faker.number.int({ min: 5, max: 200 }),
                categoryId: category.id,
                brandId: brand.id,
                image: `/uploads/${faker.image.url()}`,
                imageAlt: faker.commerce.productName(),
                status: faker.datatype.boolean(),
                isFeatured: faker.datatype.boolean(0.3),
                hasVariants: faker.datatype.boolean(0.5),
                freeDelivery: faker.datatype.boolean(0.4),
                minQuantity: 1,
                deliveryCharge: faker.number.int({ min: 0, max: 500 }),
                specifications: {
                    brand: brand.name,
                    category: category.name,
                    gender,
                    color,
                    material: faker.helpers.arrayElement(['Leather', 'Suede', 'Canvas', 'Rubber', 'Knit']),
                },
                tags: faker.helpers.arrayElements(faker.lorem.words(5), 3).join(', '),
                metaTitle: faker.commerce.productName(),
                metaKeywords: faker.helpers.arrayElements(faker.lorem.words(5), 3).join(', '),
                metaDescription: faker.lorem.sentence(),
            },
        });
    }

    // Create banners
    const bannerTitles = [
        'Welcome to Ladies Shoe Club',
        'Summer Collection 2024',
        'Up to 50% Off',
        'New Arrivals',
        'Best Sellers'
    ];

    const bannerLinks = [
        '/shop',
        '/collections/summer',
        '/shop',
        '/new-arrivals',
        '/best-sellers'
    ];

    // Get created products for banner references
    const products = await prisma.product.findMany({ take: 30 });

    for (let i = 0; i < 5; i++) {
        const active = faker.datatype.boolean(0.8);
        const product = products.length > 0 ? faker.helpers.arrayElement(products) : null;

        const banner = await prisma.banner.create({
            data: {
                title: bannerTitles[i] || faker.lorem.sentence(),
                subtitle: faker.lorem.sentence(),
                linkUrl: bannerLinks[i] || '/shop',
                bannerType: faker.helpers.arrayElement(['hero', 'promo', 'category']),
                active,
                sortOrder: i,
                productId: product?.id || null,
                image: `/uploads/${faker.image.url()}`,
                createdAt: faker.date.past(),
            },
        });
    }

    // Create announcements
    const announcements = [
        'Free shipping on orders over $50',
        '20% off your first order',
        'New collection just launched',
        'Free returns within 30 days',
        '24/7 customer support'
    ];

    for (let i = 0; i < announcements.length; i++) {
        await prisma.announcement.create({
            data: {
                message: announcements[i],
                isFlashSale: i % 2 === 0,
                active: true,
            },
        });
    }

    // Create some coupons - skip if already exist
    const couponCodes = ['WELCOME10', 'SUMMER20', 'FREESHIP', 'NEWARRIVAL15'];

    for (let i = 0; i < couponCodes.length; i++) {
        // Check if coupon already exists
        const existing = await prisma.coupon.findUnique({
            where: { code: couponCodes[i] },
        });

        if (existing) {
            console.log(`Coupon ${couponCodes[i]} already exists, skipping...`);
            continue;
        }

        await prisma.coupon.create({
            data: {
                code: couponCodes[i],
                discountType: i % 2 === 0 ? 'percentage' : 'fixed_amount',
                discountValue: i % 2 === 0 ? 10 : 20,
                minOrderAmount: i * 500,
                maxUses: faker.number.int({ min: 10, max: 100 }),
                usedCount: faker.number.int({ min: 0, max: 50 }),
                isActive: true,
                validFrom: new Date(),
                validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
        });
    }

    console.log('Database seeded successfully!');
    console.log(`Admin: admin@node.local / Admin@12345`);
    console.log(`Categories: ${categories.length} created`);
    console.log(`Brands: ${brands.length} created`);
    console.log(`Products: 30 created`);
    console.log(`Banners: 5 created`);
    console.log(`Announcements: ${announcements.length} created`);
    console.log(`Coupons: ${couponCodes.length} created`);
}

main()
    .catch((error) => {
        console.error('Error seeding database:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });