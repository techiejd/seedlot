import { getAuth as adminAuth} from 'firebase-admin/auth'; // Firebase Admin SDK

export async function POST(request: Request) {
  const { publicKey } = await request.json();
  
  try {
    const customToken = await adminAuth().createCustomToken(publicKey);
    return new Response(JSON.stringify({ customToken }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Error creating custom token' }), { status: 500 });
  }
}
