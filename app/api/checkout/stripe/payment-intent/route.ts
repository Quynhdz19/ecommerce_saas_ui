import { calculateOrderAmount } from '@/actions/orderActions';
import { Schema } from '@/amplify/data/resource';
import outputs from '@/amplify_outputs.json';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

Amplify.configure(outputs);

const client = generateClient<Schema>();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(request: Request) {
  const body = await request.json();
  const { email, plan } = body;
  const amount = calculateOrderAmount(plan);

  try {
    const payload: Stripe.PaymentIntentCreateParams = {
      currency: 'usd',
      amount,
      automatic_payment_methods: {
        enabled: true,
      },
    };
  
    if (email) {
      payload.receipt_email = email;
    }
  
    const paymentIntent = await stripe.paymentIntents.create(payload);
  
    const order = await client.models.Order.create({
      email,
      amount,
      timestamp: new Date().toISOString(),
      status: 'pending',
      externalId: paymentIntent.id,
      payment: 'stripe',
    });
    if (!order.data?.id) {
      return NextResponse.json(
        {
          success: false,
          error: order.errors,
        },
        { status: 500 }
      );
    }
  
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      dpmCheckerLink: `https://dashboard.stripe.com/settings/payment_methods/review?transaction_id=${paymentIntent.id}`,
      orderId: order.data.id,
      orderExternalId: order.data.externalId,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        success: false,
        error,
      },
      { status: 500 }
    );
  }
}


