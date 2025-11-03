import { PrismaClient, UserRole } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Create categories and conditions for auctions
const categories = [
  'ELECTRONICS', 'CLOTHING', 'BOOKS', 'FURNITURE', 
  'SPORTS', 'JEWELRY', 'ART', 'COLLECTIBLES', 'VEHICLES', 'OTHER'
]

const conditions = ['New', 'Like New', 'Good', 'Fair', 'Poor']

// Sample auction data with real Unsplash images
const sampleAuctions = [
  {
    title: "Vintage MacBook Pro 13\" (2019)",
    description: "Excellent condition MacBook Pro. Used for university work. Includes charger and original box. Intel i5 processor, 8GB RAM, 256GB SSD. Perfect for students!",
    category: "ELECTRONICS",
    condition: "Like New",
    startingPrice: 600,
    images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=600&fit=crop&auto=format"],
    startTime: new Date(),
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  },
  {
    title: "Nintendo Switch OLED with Games",
    description: "Nintendo Switch OLED in perfect condition. Includes 5 games: The Legend of Zelda, Animal Crossing, Mario Kart, Super Smash Bros, and Pokemon. All accessories included.",
    category: "ELECTRONICS",
    condition: "New",
    startingPrice: 250,
    buyNowPrice: 400,
    images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop&auto=format"],
    startTime: new Date(),
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
  },
  {
    title: "Designer Leather Backpack",
    description: "High-quality leather backpack from a premium brand. Barely used, perfect for commuting to campus. Multiple compartments, laptop sleeve, water bottle holder.",
    category: "CLOTHING",
    condition: "Good",
    startingPrice: 80,
    images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop&auto=format"],
    startTime: new Date(),
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
  },
  {
    title: "Gaming Chair - Ergonomic",
    description: "Ergonomic gaming chair with lumbar support. Perfect for long study sessions. Adjustable height and armrests. Great condition!",
    category: "FURNITURE",
    condition: "Like New",
    startingPrice: 150,
    buyNowPrice: 250,
    images: ["https://images.unsplash.com/photo-1605792657660-596af9009b82?w=800&h=600&fit=crop&auto=format"],
    startTime: new Date(),
    endTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
  },
  {
    title: "Textbook Bundle - Computer Science",
    description: "Complete collection of CS textbooks from first year. Includes Introduction to Algorithms, Database Systems, Operating Systems, and more. All in excellent condition.",
    category: "BOOKS",
    condition: "Good",
    startingPrice: 50,
    images: ["https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop&auto=format"],
    startTime: new Date(),
    endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
  },
  {
    title: "iPhone 15 Pro Max 256GB",
    description: "Brand new iPhone 15 Pro Max, still in sealed box. Titanium Blue color. Complete with all accessories. Perfect gift!",
    category: "ELECTRONICS",
    condition: "New",
    startingPrice: 900,
    buyNowPrice: 1200,
    images: ["https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=600&fit=crop&auto=format"],
    startTime: new Date(),
    endTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
  },
  {
    title: "Vintage Camera Collection",
    description: "Beautiful collection of vintage film cameras. Includes Polaroid, Canon AE-1, and Nikon FM2. All in working condition. Great for photography enthusiasts!",
    category: "ELECTRONICS",
    condition: "Fair",
    startingPrice: 300,
    images: ["https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&h=600&fit=crop&auto=format"],
    startTime: new Date(),
    endTime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
  },
  {
    title: "Wireless Bluetooth Headphones",
    description: "Premium noise-cancelling headphones. Perfect for studying in noisy dorm rooms. Excellent battery life and sound quality.",
    category: "ELECTRONICS",
    condition: "Like New",
    startingPrice: 70,
    buyNowPrice: 120,
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop&auto=format"],
    startTime: new Date(),
    endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
  },
  {
    title: "Gaming Keyboard Mechanical RGB",
    description: "RGB mechanical gaming keyboard with Cherry MX switches. Perfect for coding and gaming. Great tactile feedback!",
    category: "ELECTRONICS",
    condition: "Good",
    startingPrice: 60,
    images: ["https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&h=600&fit=crop&auto=format"],
    startTime: new Date(),
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
  },
  {
    title: "Vintage Watch - Omega",
    description: "Classic vintage Omega watch in excellent condition. Perfect for special occasions. Recently serviced and working perfectly.",
    category: "JEWELRY",
    condition: "Like New",
    startingPrice: 500,
    buyNowPrice: 750,
    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop&auto=format"],
    startTime: new Date(),
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  },
  {
    title: "Bicycle - Mountain Bike",
    description: "Quality mountain bike perfect for getting around campus. Well-maintained, new tires, great brakes. Includes lock and lights.",
    category: "SPORTS",
    condition: "Good",
    startingPrice: 180,
    images: ["https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&h=600&fit=crop&auto=format"],
    startTime: new Date(),
    endTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
  },
  {
    title: "Art Supplies Bundle",
    description: "Complete art supplies collection including paints, brushes, canvases, and sketchbooks. Great for art students. Everything is brand new!",
    category: "ART",
    condition: "New",
    startingPrice: 40,
    images: ["https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop&auto=format"],
    startTime: new Date(),
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
  },
]

async function seed() {
  console.log('🌱 Starting database seed...')

  try {
    // Create test users in Supabase Auth first
    const testUsers = [
      {
        email: 'student1@centralasian.uz',
        password: 'Student123',
        name: 'Alice Johnson',
        university: 'Central Asian University (CAU)'
      },
      {
        email: 'student2@centralasian.uz',
        password: 'Student123',
        name: 'Bob Smith',
        university: 'Central Asian University (CAU)'
      },
      {
        email: 'student3@centralasian.uz',
        password: 'Student123',
        name: 'Charlie Brown',
        university: 'Central Asian University (CAU)'
      },
      {
        email: 'professor@centralasian.uz',
        password: 'Professor123',
        name: 'Dr. Sarah Williams',
        university: 'Central Asian University (CAU)',
        role: 'ADMIN'
      },
    ]

    let createdUsers: any[] = []

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      for (const testUser of testUsers) {
        try {
          // Create user in Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: testUser.email,
            password: testUser.password,
            email_confirm: true, // Auto-confirm for testing
            user_metadata: {
              name: testUser.name,
              university: testUser.university
            }
          })

          if (authError) {
            // If user already exists, fetch them from database
            if (authError.code === 'email_exists') {
              const existingUser = await prisma.user.findUnique({
                where: { email: testUser.email }
              })
              if (existingUser) {
                createdUsers.push(existingUser)
                console.log(`✅ Using existing user: ${testUser.name} (${testUser.email})`)
                continue
              }
            }
            console.error(`Error creating user ${testUser.email}:`, authError)
            continue
          }

          if (authData?.user) {
            // Create user in database
            const dbUser = await prisma.user.upsert({
              where: { id: authData.user.id },
              update: {},
              create: {
                id: authData.user.id,
                email: testUser.email,
                name: testUser.name,
                university: testUser.university,
                verified: true,
                role: (testUser.role as UserRole) || UserRole.USER
              }
            })

            createdUsers.push(dbUser)
            console.log(`✅ Created user: ${testUser.name} (${testUser.email})`)
          }
        } catch (error) {
          console.error(`Error creating user ${testUser.email}:`, error)
        }
      }
    } else {
      console.log('⚠️  Supabase credentials not found. Skipping user creation.')
      console.log('⚠️  Please create users manually or set up Supabase credentials.')
      
      // Check if we have existing users
      const existingUsers = await prisma.user.findMany({ take: 5 })
      createdUsers = existingUsers
      console.log(`📊 Found ${existingUsers.length} existing users in database`)
    }

    if (createdUsers.length === 0) {
      console.log('⚠️  No users available. Cannot create auctions.')
      return
    }
    
    // Clear existing auctions and bids for clean seed
    console.log('\n🗑️  Clearing existing auctions and bids...')
    await prisma.bid.deleteMany({})
    await prisma.auction.deleteMany({})
    console.log('✅ Cleared existing data')

    // Create auctions
    console.log('\n📦 Creating auctions...')
    const createdAuctions = []

    for (let i = 0; i < sampleAuctions.length; i++) {
      const auctionData = sampleAuctions[i]
      const seller = createdUsers[i % createdUsers.length] // Distribute auctions among users
      
      try {
        const auction = await prisma.auction.create({
          data: {
            ...auctionData,
            userId: seller.id,
            currentPrice: auctionData.startingPrice,
            status: 'ACTIVE',
          }
        })
        createdAuctions.push(auction)
        console.log(`✅ Created auction: ${auction.title}`)
      } catch (error) {
        console.error(`Error creating auction ${auctionData.title}:`, error)
      }
    }

    // Create some bids for variety
    console.log('\n💰 Creating sample bids...')
    let bidCount = 0
    
    for (const auction of createdAuctions) {
      // Create 2-5 bids per auction from different users
      const numBids = Math.floor(Math.random() * 4) + 2
      let currentPrice = Number(auction.startingPrice)
      
      for (let i = 0; i < numBids; i++) {
        const bidder = createdUsers[Math.floor(Math.random() * createdUsers.length)]
        
        // Make sure bidder is not the seller
        if (bidder.id === auction.userId) {
          continue
        }
        
        // Increment bid by 5-20%
        const increment = currentPrice * (Math.random() * 0.15 + 0.05)
        currentPrice += increment
        
        try {
          await prisma.bid.create({
            data: {
              auctionId: auction.id,
              userId: bidder.id,
              amount: currentPrice,
            }
          })
          bidCount++
          
          // Update auction current price
          await prisma.auction.update({
            where: { id: auction.id },
            data: { currentPrice }
          })
        } catch (error) {
          console.error(`Error creating bid:`, error)
        }
      }
    }

    console.log(`✅ Created ${bidCount} bids`)

    console.log('\n🎉 Seed completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   Users: ${createdUsers.length}`)
    console.log(`   Auctions: ${createdAuctions.length}`)
    console.log(`   Bids: ${bidCount}`)
    
    // Print login credentials
    console.log('\n🔐 Test Account Credentials:')
    console.log('   Student 1: student1@centralasian.uz / Student123')
    console.log('   Student 2: student2@centralasian.uz / Student123')
    console.log('   Student 3: student3@centralasian.uz / Student123')
    console.log('   Professor: professor@centralasian.uz / Professor123')
    
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seed()
  .then(() => {
    console.log('✅ Seed script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error)
    process.exit(1)
  })

