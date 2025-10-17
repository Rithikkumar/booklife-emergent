-- Create author applications table for verification requests
CREATE TABLE public.author_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  social_profiles JSONB DEFAULT '{}'::jsonb,
  government_id_url TEXT,
  author_photo_url TEXT,
  isbn_list TEXT[],
  publisher_name TEXT,
  publisher_email TEXT,
  book_links TEXT[],
  bio TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewer_notes TEXT,
  verification_documents JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create verified authors table for approved authors
CREATE TABLE public.verified_authors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  application_id UUID NOT NULL,
  verification_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  author_badge_level TEXT NOT NULL DEFAULT 'verified' CHECK (author_badge_level IN ('verified', 'established', 'bestseller')),
  verified_books JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.author_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verified_authors ENABLE ROW LEVEL SECURITY;

-- RLS policies for author_applications
CREATE POLICY "Users can view their own applications" 
ON public.author_applications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications" 
ON public.author_applications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending applications" 
ON public.author_applications 
FOR UPDATE 
USING (auth.uid() = user_id AND status = 'pending');

-- RLS policies for verified_authors
CREATE POLICY "Anyone can view verified authors" 
ON public.verified_authors 
FOR SELECT 
USING (true);

-- Create storage bucket for author verification documents
INSERT INTO storage.buckets (id, name, public) VALUES ('author-documents', 'author-documents', false);

-- Create storage policies for author documents
CREATE POLICY "Users can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'author-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'author-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'author-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create trigger for updated_at timestamps
CREATE TRIGGER update_author_applications_updated_at
BEFORE UPDATE ON public.author_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_verified_authors_updated_at
BEFORE UPDATE ON public.verified_authors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraints
ALTER TABLE public.author_applications 
ADD CONSTRAINT fk_author_applications_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.verified_authors 
ADD CONSTRAINT fk_verified_authors_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.verified_authors 
ADD CONSTRAINT fk_verified_authors_application_id 
FOREIGN KEY (application_id) REFERENCES public.author_applications(id) ON DELETE CASCADE;