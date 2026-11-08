// Hand-written types for the inv_* tables. Keep in sync with supabase/migrations.

export type EventType = "private" | "business";
export type RegistrationStatus = "confirmed" | "cancelled";
export type RegistrationSource = "self" | "manual";

export type EventRow = {
  id: string;
  slug: string;
  title: string;
  event_type: EventType;
  description: string | null;
  date_time: string;
  venue_name: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  template_id: string;
  media_url: string | null;
  primary_color: string | null;
  gift_link_url: string | null;
  reminder_offset_hours: number;
  reminder_sent_at: string | null;
  rsvp_deadline: string | null;
  max_guests: number | null;
  invitation_message: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type EventInsert = Omit<EventRow, "id" | "created_at" | "updated_at" | "reminder_sent_at" | "invitation_message"> & {
  id?: string;
  invitation_message?: string | null;
};
export type EventUpdate = Partial<EventInsert & { reminder_sent_at: string | null }>;

export type RegistrationRow = {
  id: string;
  event_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  guest_count: number;
  guest_names: string[];
  notes: string | null;
  status: RegistrationStatus;
  source: RegistrationSource;
  table_id: string | null;
  created_at: string;
  updated_at: string;
};

export type RegistrationInsert = Omit<RegistrationRow, "id" | "created_at" | "updated_at" | "table_id"> & { table_id?: string | null };
export type RegistrationUpdate = Partial<RegistrationInsert>;

export type TableRow = {
  id: string;
  event_id: string;
  name: string;
  capacity: number;
  sort_order: number;
  created_at: string;
};

export type EmailKind = "reminder" | "manual" | "test";
export type EmailStatus = "sent" | "failed";

export type EmailLogRow = {
  id: string;
  event_id: string | null;
  registration_id: string | null;
  kind: EmailKind;
  to_email: string;
  subject: string;
  status: EmailStatus;
  error: string | null;
  sent_by: string | null;
  created_at: string;
};

export type Channel = "email" | "sms" | "whatsapp";

export type InviteeRow = {
  id: string;
  event_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
};

export type InvitationLogRow = {
  id: string;
  event_id: string;
  invitee_id: string | null;
  channel: Channel;
  to_address: string;
  status: EmailStatus;
  error: string | null;
  provider_id: string | null;
  sent_by: string | null;
  created_at: string;
};

export type StaffRow = {
  user_id: string;
  email: string;
  display_name: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      inv_events: { Row: EventRow; Insert: EventInsert; Update: EventUpdate; Relationships: [] };
      inv_registrations: {
        Row: RegistrationRow;
        Insert: RegistrationInsert;
        Update: RegistrationUpdate;
        Relationships: [
          {
            foreignKeyName: "inv_registrations_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "inv_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inv_registrations_table_id_fkey";
            columns: ["table_id"];
            isOneToOne: false;
            referencedRelation: "inv_tables";
            referencedColumns: ["id"];
          },
        ];
      };
      inv_tables: {
        Row: TableRow;
        Insert: Omit<TableRow, "id" | "created_at" | "sort_order"> & { id?: string; sort_order?: number };
        Update: Partial<Omit<TableRow, "id" | "created_at">>;
        Relationships: [];
      };
      inv_email_log: {
        Row: EmailLogRow;
        Insert: Omit<EmailLogRow, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<EmailLogRow, "id" | "created_at">>;
        Relationships: [];
      };
      inv_invitees: {
        Row: InviteeRow;
        Insert: Omit<InviteeRow, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Omit<InviteeRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      inv_invitation_log: {
        Row: InvitationLogRow;
        Insert: Omit<InvitationLogRow, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<InvitationLogRow, "id" | "created_at">>;
        Relationships: [];
      };
      inv_staff: {
        Row: StaffRow;
        Insert: Omit<StaffRow, "created_at">;
        Update: Partial<Omit<StaffRow, "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      inv_is_staff: { Args: Record<string, never>; Returns: boolean };
      inv_public_event: { Args: { p_slug: string }; Returns: Record<string, unknown> | null };
      inv_register: {
        Args: {
          p_slug: string;
          p_full_name: string;
          p_phone: string;
          p_email: string | null;
          p_guest_count: number;
          p_guest_names: string[];
          p_notes: string | null;
        };
        Returns: { id: string; created: boolean };
      };
    };
    Enums: {
      inv_channel: Channel;
      inv_email_kind: EmailKind;
      inv_email_status: EmailStatus;
      inv_event_type: EventType;
      inv_registration_status: RegistrationStatus;
      inv_registration_source: RegistrationSource;
    };
    CompositeTypes: Record<string, never>;
  };
};
