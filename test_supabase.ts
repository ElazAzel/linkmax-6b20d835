import { supabase } from 'c:/Users/i.azelkhanov/Documents/inkmax/src/platform/supabase/client';

async function test() {
  const { data, error } = await supabase.from('missing_table' as never).select('*');
  console.log(data); // What is the type of data?
}
test();
