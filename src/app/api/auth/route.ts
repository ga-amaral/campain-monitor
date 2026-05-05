import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json(
        { error: 'A senha de administrador não foi configurada no servidor.' },
        { status: 500 }
      );
    }

    if (password === adminPassword) {
      const response = NextResponse.json({ success: true });
      
      // Criar cookie de sessão com 7 dias de validade
      response.cookies.set('monitor_admin_auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 dias
        path: '/',
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Senha incorreta.' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno ao processar login.' },
      { status: 500 }
    );
  }
}

// Rota de Logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('monitor_admin_auth');
  return response;
}
