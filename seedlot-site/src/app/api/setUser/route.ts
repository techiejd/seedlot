import { doc, setDoc } from "firebase/firestore";
import { db } from "./../../../config/firebaseConfig";

export async function POST(request: Request) {
    const { publicKey, name, role } = await request.json();
    const user = await setDoc(doc(db, "users", publicKey.toString()), {
        role: role,
        name: name,
        publicKey: publicKey,
        createdAt: new Date(),
      });
  return new Response(JSON.stringify({ user: user }), { status: 200 });
      
  }
  