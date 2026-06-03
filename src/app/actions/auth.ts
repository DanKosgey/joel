'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function registerUser(formData: FormData) {
  try {
    const name     = formData.get('name') as string;
    const email    = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!name || !email || !password) {
      throw new Error('Please provide name, email, and password');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'CLIENT', // Default to CLIENT
      },
    });

    return { success: true, userId: user.id };
  } catch (error: any) {
    console.error('Registration Error:', error);
    return { success: false, error: error.message };
  }
}
