
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pphdcfxucfndmwulpfwv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwaGRjZnh1Y2ZuZG13dWxwZnd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMTgwMDcsImV4cCI6MjA3OTc5NDAwN30.u5O_XrdvtjHaZjsAkVZyoYbNQIBKx9xfVxRFuUi2WbA'

const supabase = createClient(supabaseUrl, supabaseKey)

const slug = 'sei.almau2023'

async function findAccount() {
    console.log('Searching for slug:', slug)
    const { data, error } = await supabase
        .from('pages')
        .select('id, user_id, slug')
        .eq('slug', slug)
        .maybeSingle()

    if (error) {
        console.error('Error:', error)
        process.exit(1)
    }

    if (!data) {
        console.log('No page found for slug:', slug)
        process.exit(0)
    }

    console.log('FOUND DATA:', JSON.stringify(data, null, 2))

    // Try to get more info about the user
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, email, username')
        .eq('id', data.user_id)
        .maybeSingle()

    if (profile) {
        console.log('FOUND PROFILE:', JSON.stringify(profile, null, 2))
    }
}

findAccount()
