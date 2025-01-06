import { createClient } from '@supabase/supabase-js';
import { ALL_SETTERS } from '../app/config/setters';

const supabaseUrl = 'https://lrsaqplgannrjhpztatb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxyc2FxcGxnYW5ucmpocHp0YXRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTMzMDk3NiwiZXhwIjoyMDUwOTA2OTc2fQ.BarOYEh2lC3AvHKBLIIerUgX8cfG4ablG217dxFxiIQ'; // This needs to be the service key, not the anon key

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define head setters
const HEAD_SETTERS = ['Luke S.', 'Evan', 'Austin', 'Canon', 'Tucker', 'Nicole', 'Jack S.'];

async function createUsers() {
    // Skip Luke S. since they already exist
    const settersToCreate = ALL_SETTERS.filter(setter => setter.name !== 'Luke S.');

    for (const setter of settersToCreate) {
        try {
            console.log(`Creating auth account for ${setter.name}...`);
            
            // Create the auth user
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
                email: setter.email,
                password: '123', // Simple password as requested
                email_confirm: true
            });

            if (authError) {
                console.error(`Error creating auth user for ${setter.name}:`, authError);
                continue;
            }

            // Update the role in the users table to reflect head setter status
            if (HEAD_SETTERS.includes(setter.name)) {
                const { error: updateError } = await supabase
                    .from('users')
                    .update({ role: 'head_setter' })
                    .eq('name', setter.name);

                if (updateError) {
                    console.error(`Error updating role for ${setter.name}:`, updateError);
                }
            }

            console.log(`Successfully created auth account for ${setter.name}`);
            
        } catch (error) {
            console.error(`Unexpected error for ${setter.name}:`, error);
        }
    }
}

// Run the script
createUsers()
    .then(() => console.log('Finished creating users'))
    .catch(console.error);