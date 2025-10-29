-- Supabase Row Level Security (RLS) Policies
-- Run these in your Supabase SQL Editor

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Auctions table policies
CREATE POLICY "Anyone can view active auctions" ON auctions
    FOR SELECT USING (status = 'ACTIVE');

CREATE POLICY "Users can view their own auctions" ON auctions
    FOR SELECT USING (auth.uid() = userId);

CREATE POLICY "Users can create auctions" ON auctions
    FOR INSERT WITH CHECK (auth.uid() = userId);

CREATE POLICY "Users can update their own auctions" ON auctions
    FOR UPDATE USING (auth.uid() = userId);

CREATE POLICY "Users can delete their own auctions" ON auctions
    FOR DELETE USING (auth.uid() = userId);

-- Bids table policies
CREATE POLICY "Anyone can view bids for active auctions" ON bids
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auctions 
            WHERE auctions.id = bids.auctionId 
            AND auctions.status = 'ACTIVE'
        )
    );

CREATE POLICY "Users can view their own bids" ON bids
    FOR SELECT USING (auth.uid() = userId);

CREATE POLICY "Authenticated users can create bids" ON bids
    FOR INSERT WITH CHECK (auth.uid() = userId);

-- Notifications table policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = userId);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = userId);

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, avatar, university, verified, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
        COALESCE(NEW.raw_user_meta_data->>'university', NULL),
        COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update user verification status
CREATE OR REPLACE FUNCTION public.handle_user_verification()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users
    SET verified = (NEW.email_confirmed_at IS NOT NULL),
        updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user verification
CREATE TRIGGER on_auth_user_verified
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_verification();
