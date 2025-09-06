import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'; // Versão atualizada

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, firstName, lastName } = await req.json();

    // Create a Supabase client with the service role key
    // This client bypasses Row Level Security and is used for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if the email is in the authorized_users table
    const { data: authorizedUser, error: authError } = await supabaseAdmin
      .from('authorized_users')
      .select('email')
      .eq('email', email)
      .single();

    if (authError && authError.code !== 'PGRST116') { // PGRST116 means "no rows found"
      console.error('Error checking authorized users:', authError);
      return new Response(JSON.stringify({ error: 'Erro interno ao verificar autorização.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!authorizedUser) {
      return new Response(JSON.stringify({ error: 'Este email não está autorizado a criar uma conta.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403, // Forbidden
      });
    }

    // If authorized, proceed with user creation using the service role key
    // email_confirm: true automatically confirms the email for whitelisted users
    const { data: user, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, 
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (signUpError) {
      console.error('Error creating user:', signUpError);
      return new Response(JSON.stringify({ error: signUpError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    return new Response(JSON.stringify({ message: 'Conta criada com sucesso!', user: user.user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Unexpected error in custom-signup:', error);
    return new Response(JSON.stringify({ error: 'Ocorreu um erro inesperado.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});