import { cookies } from "next/headers";
import { verifySession } from "@/utils/session";
import { privateKeyToAccount } from "viem/accounts";
import { type Address} from 'viem'

export async function POST(req: Request) {
  const { input } = await req.json();
  const cookieStore = await cookies()
  const session = cookieStore.get('user_session');

  // Verify session
  if (!session) {
    console.log('session')
    return new Response('Not authenticated', { status: 401 });
  }

  const { valid, data } = await verifySession(session.value);
  if (!valid || !data?.userId) {
    console.log('valid')
    return new Response('Not authenticated', { status: 401 });
  }

  // Check address
  try {
    const privateKey: Address = input.startsWith('0x') ? input as Address : `0x${input}` as Address;
    const account = privateKeyToAccount(privateKey);
    if (account.address !== data.address)
      return new Response('The private secret you set does not match your current address', { status: 400 })
  } catch {
    return new Response('The private secret you set does not match your current address', { status: 400 })
  }
  
  // Log or handle however you want
  console.log("Saving input to server:", input);

  // Save to a cookie
  cookieStore.set(`pk`, input, {
    httpOnly: true,
    secure: true,
    path: "/",
    maxAge: 3600,  // 1 hours
  });

  return new Response('Private key saved', { status: 200 });
}

export async function GET() {
  const cookieStore = await cookies()

  const session = cookieStore.get('user_session');

  // Verify session
  if (!session) {
    console.log('session')
    return new Response('Not authenticated', { status: 401 });
  }

  const { valid, data } = await verifySession(session.value);
  if (!valid || !data?.userId) {
    console.log('valid')
    return new Response('Not authenticated', { status: 401 });
  }

  const pk = cookieStore.get('pk')

  if (!pk) {
    return new Response('No pk found', { status: 404 })
  }

  return new Response(JSON.stringify({ pk }), { status: 200})
}
