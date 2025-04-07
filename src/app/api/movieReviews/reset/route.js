import { NextResponse } from 'next/server';
import { reviewsStore } from '../../../../lib/apiStore';

export async function POST() {
  try {
    reviewsStore.reset();
    return NextResponse.json({ message: 'Reviews reset successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}