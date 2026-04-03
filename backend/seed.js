const dotenv = require("dotenv");
const connectDB = require("./config/db");
const User = require("./models/User");
const Worker = require("./models/Worker");
const Job = require("./models/Job");
const Setting = require("./models/Setting");

dotenv.config({ override: true });

const seedData = async () => {
  try {
    await connectDB();

    await Promise.all([
      User.deleteMany(),
      Worker.deleteMany(),
      Job.deleteMany(),
      Setting.deleteMany()
    ]);

    const users = await User.create([
      {
        name: "Rohan Patil",
        email: "rohan.patil@example.com",
        password: "password123",
        role: "user",
        phone: "9876543210",
        location: "Mumbai",
        company: "Patil Infra Services"
      },
      {
        name: "Sneha Kulkarni",
        email: "sneha.kulkarni@example.com",
        password: "password123",
        role: "user",
        phone: "9988776655",
        location: "Pune",
        company: "Kulkarni Home Solutions"
      },
      {
        name: "Amit Shinde",
        email: "amit.shinde@example.com",
        password: "password123",
        role: "worker",
        phone: "9822001122",
        location: "Mumbai"
      },
      {
        name: "Priya Jadhav",
        email: "priya.jadhav@example.com",
        password: "password123",
        role: "worker",
        phone: "9811002233",
        location: "Pune"
      },
      {
        name: "Karan More",
        email: "karan.more@example.com",
        password: "password123",
        role: "worker",
        phone: "9800003344",
        location: "Solapur"
      },
      {
        name: "Admin Mehta",
        email: "admin@worklink.in",
        password: "password123",
        role: "admin",
        phone: "9999999999",
        location: "Mumbai"
      }
    ]);

    const [rohan, sneha, amit, priya, karan, admin] = users;

    const workers = await Worker.create([
      {
        userId: amit._id,
        skills: ["Electrician", "Wiring", "Appliance Repair"],
        experience: 6,
        location: "Mumbai",
        pricePerHour: 550,
        bio: "Licensed electrician for residential and commercial work.",
        availability: "available",
        rating: 4.7,
        reviews: 28,
        completedJobs: 18,
        earnings: 94000,
        languages: ["Hindi", "Marathi"]
      },
      {
        userId: priya._id,
        skills: ["Plumber", "Pipe Fitting", "Bathroom Repair"],
        experience: 5,
        location: "Pune",
        pricePerHour: 480,
        bio: "Reliable plumber for urgent repairs and installation jobs.",
        availability: "busy",
        rating: 4.5,
        reviews: 22,
        completedJobs: 14,
        earnings: 72000,
        languages: ["Hindi", "Marathi", "English"]
      },
      {
        userId: karan._id,
        skills: ["Developer", "JavaScript", "Website Fixes"],
        experience: 4,
        location: "Solapur",
        pricePerHour: 900,
        bio: "Full-stack developer for landing pages, dashboards, and fixes.",
        availability: "available",
        rating: 4.8,
        reviews: 31,
        completedJobs: 20,
        earnings: 165000,
        languages: ["Hindi", "English"]
      }
    ]);

    const [amitWorker, priyaWorker, karanWorker] = workers;

    await Job.create([
      {
        title: "House Wiring Upgrade for 2BHK Flat",
        description: "Need an experienced electrician to upgrade old wiring and install new switches in a 2BHK apartment.",
        budget: 12000,
        location: "Mumbai",
        status: "open",
        category: "Electrical",
        duration: "3 days",
        requirements: "Bring your own toolkit and previous residential experience.",
        contactPhone: rohan.phone,
        postedBy: rohan._id,
        applicants: [amit._id]
      },
      {
        title: "Bathroom Pipeline Leakage Repair",
        description: "Looking for a plumber to fix a leaking bathroom pipeline and check pressure issues in the wash area.",
        budget: 4500,
        location: "Pune",
        status: "hired",
        category: "Plumbing",
        duration: "1 day",
        requirements: "Urgent same-day availability preferred.",
        contactPhone: sneha.phone,
        postedBy: sneha._id,
        assignedTo: priyaWorker._id,
        applicants: [priya._id]
      },
      {
        title: "Business Website Bug Fixes",
        description: "Need a developer to fix contact form issues, mobile layout bugs, and improve loading speed for a small business website.",
        budget: 18000,
        location: "Solapur",
        status: "completed",
        category: "Development",
        duration: "5 days",
        requirements: "Experience with JavaScript and responsive layouts.",
        contactPhone: rohan.phone,
        postedBy: rohan._id,
        assignedTo: karanWorker._id,
        applicants: [karan._id],
        completedDate: new Date("2026-03-15")
      },
      {
        title: "Ceiling Fan Installation in Office",
        description: "Need installation of six ceiling fans and basic safety checks in a small office space.",
        budget: 7000,
        location: "Pune",
        status: "open",
        category: "Electrical",
        duration: "2 days",
        requirements: "Commercial office experience is a plus.",
        contactPhone: sneha.phone,
        postedBy: sneha._id,
        applicants: [amit._id]
      },
      {
        title: "Kitchen Sink and Tap Replacement",
        description: "Need a plumber to replace an old kitchen sink tap and inspect drainage flow issues.",
        budget: 3500,
        location: "Mumbai",
        status: "closed",
        category: "Plumbing",
        duration: "1 day",
        requirements: "Material cost excluded from the budget.",
        contactPhone: rohan.phone,
        postedBy: rohan._id
      },
      {
        title: "Landing Page for Coaching Institute",
        description: "Need a responsive landing page with admission form, testimonials, and WhatsApp CTA for a coaching institute.",
        budget: 22000,
        location: "Pune",
        status: "open",
        category: "Development",
        duration: "1 week",
        requirements: "Portfolio of recent frontend work preferred.",
        contactPhone: sneha.phone,
        postedBy: sneha._id,
        applicants: [karan._id]
      }
    ]);

    await Setting.create({
      platformName: "WorkLink",
      adminEmail: admin.email,
      contactPhone: admin.phone,
      commission: 10
    });

    console.log("Seed data inserted successfully");
    process.exit(0);
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    process.exit(1);
  }
};

seedData();
