import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Example functions to replace Prisma
export const db = {
  // Users
  users: {
    async create(data: { email: string; firstName: string; lastName: string; passwordHash: string }) {
      const { data: user, error } = await supabase
        .from('User')
        .insert([data])
        .select()
        .single()
      
      if (error) throw error
      return user
    },

    async findUnique(where: { id?: string; email?: string }) {
      const { data: user, error } = await supabase
        .from('User')
        .select('*')
        .match(where)
        .single()
      
      if (error) throw error
      return user
    }
  },

  // Patients
  patients: {
    async create(data: any) {
      const { data: patient, error } = await supabase
        .from('Patient')
        .insert([data])
        .select()
        .single()
      
      if (error) throw error
      return patient
    },

    async findMany(where?: any) {
      let query = supabase.from('Patient').select('*')
      
      if (where) {
        query = query.match(where)
      }
      
      const { data: patients, error } = await query
      
      if (error) throw error
      return patients
    },

    async findUnique(where: { id: string }) {
      const { data: patient, error } = await supabase
        .from('Patient')
        .select('*')
        .match(where)
        .single()
      
      if (error) throw error
      return patient
    },

    async update(where: { id: string }, data: any) {
      const { data: patient, error } = await supabase
        .from('Patient')
        .update(data)
        .match(where)
        .select()
        .single()
      
      if (error) throw error
      return patient
    },

    async delete(where: { id: string }) {
      const { error } = await supabase
        .from('Patient')
        .delete()
        .match(where)
      
      if (error) throw error
    }
  }
}

export default db