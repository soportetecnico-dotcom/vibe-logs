export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            log_activities: {
                Row: {
                    id: string
                    log_id: string | null
                    activity_description: string
                    execution_time: string | null
                    observations: string | null
                    status: 'completed' | 'pending'
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    log_id?: string | null
                    activity_description: string
                    execution_time?: string | null
                    observations?: string | null
                    status?: 'completed' | 'pending'
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    log_id?: string | null
                    activity_description?: string
                    execution_time?: string | null
                    observations?: string | null
                    status?: 'completed' | 'pending'
                    created_at?: string | null
                }
            }
            logs: {
                Row: {
                    id: string
                    user_id: string | null
                    org_id: string | null
                    project_id: string | null
                    report_date: string | null
                    summary: string | null
                    learning: string | null
                    notes: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    org_id?: string | null
                    project_id?: string | null
                    report_date?: string | null
                    summary?: string | null
                    learning?: string | null
                    notes?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    org_id?: string | null
                    project_id?: string | null
                    report_date?: string | null
                    summary?: string | null
                    learning?: string | null
                    notes?: string | null
                    created_at?: string | null
                }
            }
            organizations: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    logo_url: string | null
                    primary_color: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    logo_url?: string | null
                    primary_color?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    logo_url?: string | null
                    primary_color?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
            profiles: {
                Row: {
                    id: string
                    org_id: string | null
                    full_name: string | null
                    role: 'owner' | 'manager' | 'contributor' | null
                    avatar_url: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    org_id?: string | null
                    full_name?: string | null
                    role?: 'owner' | 'manager' | 'contributor' | null
                    avatar_url?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    org_id?: string | null
                    full_name?: string | null
                    role?: 'owner' | 'manager' | 'contributor' | null
                    avatar_url?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
            projects: {
                Row: {
                    id: string
                    org_id: string | null
                    name: string
                    client_name: string | null
                    status: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    org_id?: string | null
                    name: string
                    client_name?: string | null
                    status?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    org_id?: string | null
                    name?: string
                    client_name?: string | null
                    status?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
            user_tasks: {
                Row: {
                    id: string
                    user_id: string | null
                    title: string
                    status: 'pending' | 'in-progress' | 'done' | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    title: string
                    status?: 'pending' | 'in-progress' | 'done' | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    title?: string
                    status?: 'pending' | 'in-progress' | 'done' | null
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
            invitations: {
                Row: {
                    id: string
                    org_id: string | null
                    email: string | null
                    token: string
                    role: string | null
                    is_used: boolean
                    expires_at: string
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    org_id?: string | null
                    email?: string | null
                    token: string
                    role?: string | null
                    is_used?: boolean
                    expires_at: string
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    org_id?: string | null
                    email?: string | null
                    token?: string
                    role?: string | null
                    is_used?: boolean
                    expires_at?: string
                    created_at?: string | null
                }
            }
        }
    }
}
