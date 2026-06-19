import User from "../models/User.js";

const demoUsers = [
  {
    name: "Admin User",
    email: "admin@example.com",
    password: "Admin@12345",
    role: "admin"
  },
  {
    name: "Customer User",
    email: "customer@example.com",
    password: "Customer@12345",
    role: "customer"
  }
];

const seedDemoUsers = async () => {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  for (const demoUser of demoUsers) {
    const existingUser = await User.findOne({ email: demoUser.email });

    if (!existingUser) {
      await User.create(demoUser);
    }
  }
};

export default seedDemoUsers;
