-- Create enum for property types
CREATE TYPE property_type_enum AS ENUM (
  'hotel',
  'bed_and_breakfast',
  'apartment',
  'villa',
  'chalet',
  'cabin',
  'glamping',
  'camping',
  'hostel',
  'guesthouse',
  'resort'
);

-- Update properties table to use the new enum and add more fields
ALTER TABLE public.properties 
DROP COLUMN property_type;

ALTER TABLE public.properties 
ADD COLUMN property_type property_type_enum DEFAULT 'apartment',
ADD COLUMN star_rating integer CHECK (star_rating >= 1 AND star_rating <= 5),
ADD COLUMN amenities text[] DEFAULT '{}',
ADD COLUMN check_in_time time DEFAULT '15:00:00',
ADD COLUMN check_out_time time DEFAULT '11:00:00';

-- Create rooms table for individual units within properties
CREATE TABLE public.rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  room_number text NOT NULL,
  room_type text DEFAULT 'standard',
  size_sqm numeric,
  max_guests integer DEFAULT 2,
  base_price numeric DEFAULT 0,
  amenities text[] DEFAULT '{}',
  description text,
  floor_number integer,
  position_description text, -- for glamping: "by the lake", "forest view" etc.
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(property_id, room_number)
);

-- Enable RLS on rooms table
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rooms
CREATE POLICY "Property owners can manage their rooms" 
ON public.rooms 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.id = rooms.property_id 
    AND properties.owner_id = auth.uid()
  )
);

-- Create storage bucket for property photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-photos', 'property-photos', true);

-- Create property photos table
CREATE TABLE public.property_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  room_id uuid REFERENCES public.rooms(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  mime_type text,
  alt_text text,
  is_primary boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on property photos
ALTER TABLE public.property_photos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for property photos
CREATE POLICY "Property owners can manage their photos" 
ON public.property_photos 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.id = property_photos.property_id 
    AND properties.owner_id = auth.uid()
  )
);

-- Create storage policies for property photos
CREATE POLICY "Property owners can upload photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'property-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Property owners can view their photos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'property-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Property owners can update their photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'property-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Property owners can delete their photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'property-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create trigger for rooms updated_at
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger for property_photos updated_at
CREATE TRIGGER update_property_photos_updated_at
  BEFORE UPDATE ON public.property_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();