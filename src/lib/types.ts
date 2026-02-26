// Database types for TackBird

export type PostType =
  | 'tarvitsen'
  | 'tarjoan'
  | 'ilmaista'
  | 'nappaa'
  | 'lainaa'
  | 'tapahtuma'
  | 'tilannehuone'

export type ProfileVisibility = 'everyone' | 'neighbors' | 'hidden'
export type LocationAccuracy = 'exact' | 'area' | 'city'
export type BadgeType = 'verified' | 'pro' | 'trusted' | 'active'

export interface Profile {
  id: string
  email: string | null
  name: string
  avatar_url: string | null
  bio: string
  naapurusto: string
  response_rate: number
  is_hub: boolean
  is_pro: boolean
  pro_expires_at: string | null
  profile_visibility: ProfileVisibility
  location_accuracy: LocationAccuracy
  notifications_enabled: boolean
  language: string
  onboarding_completed: boolean
  is_admin: boolean
  is_business: boolean
  business_name: string | null
  business_vat_id: string | null
  stripe_customer_id: string | null
  stripe_connect_account_id: string | null
  stripe_connect_onboarded: boolean
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  user_id: string
  type: PostType
  title: string
  description: string
  location: string | null
  image_url: string | null
  hub_pickup_id: string | null
  expires_at: string | null
  daily_fee: number | null
  event_date: string | null
  latitude: number | null
  longitude: number | null
  is_pro_listing: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined fields
  user?: Profile
  is_saved?: boolean
  images?: PostImage[]
}

export interface PostImage {
  id: string
  post_id: string
  image_url: string
  sort_order: number
  created_at: string
}

export interface Event {
  id: string
  post_id: string | null
  creator_id: string
  title: string
  description: string | null
  event_date: string
  location_name: string | null
  location_lat: number | null
  location_lng: number | null
  icon: string
  discount: string | null
  max_attendees: number | null
  created_at: string
  // Joined fields
  creator?: Profile
  attendee_count?: number
  is_attending?: boolean
}

export interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  post_id: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
  // Joined fields
  other_user?: Profile
  last_message?: Message
  unread_count?: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  image_url: string | null
  is_read: boolean
  created_at: string
}

export interface Hub {
  id: string
  user_id: string | null
  name: string
  type: string
  address: string | null
  icon: string
  offers: string | null
  lat: number | null
  lng: number | null
  is_active: boolean
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  from_user_id: string | null
  type: string
  title: string
  body: string | null
  link_type: string | null
  link_id: string | null
  is_read: boolean
  created_at: string
  // Joined
  from_user?: Profile
}

export interface Review {
  id: string
  reviewer_id: string
  reviewed_id: string
  post_id: string | null
  rating: number
  comment: string | null
  created_at: string
  // Joined
  reviewer?: Profile
}

export interface RentalBooking {
  id: string
  post_id: string
  lender_id: string
  borrower_id: string
  conversation_id: string | null
  start_date: string
  end_date: string
  days: number
  daily_fee: number
  total_fee: number
  platform_commission: number
  platform_commission_rate: number
  stripe_payment_intent_id: string | null
  status: string
  paid_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  created_at: string
  // Joined
  post?: Post
  lender?: Profile
  borrower?: Profile
}

export interface Advertisement {
  id: string
  advertiser_id: string
  title: string
  description: string
  image_url: string | null
  link_url: string | null
  cta_text: string
  target_naapurusto: string | null
  daily_rate: number
  start_date: string
  end_date: string
  total_cost: number
  status: string
  impressions: number
  clicks: number
  created_at: string
}
