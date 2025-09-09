import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Camera, Trash2, Star, Image as ImageIcon } from 'lucide-react';

interface PropertyPhoto {
  id: string;
  file_path: string;
  file_name: string;
  alt_text?: string;
  is_primary: boolean;
  display_order: number;
  room_id?: string;
}

interface PhotoGalleryProps {
  propertyId: string;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ propertyId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<PropertyPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [altText, setAltText] = useState('');

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('property_photos')
        .select('*')
        .eq('property_id', propertyId)
        .order('display_order');

      if (error) throw error;
      setPhotos(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [propertyId]);

  const handleFileUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0 || !user) return;

    setUploading(true);
    
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${i}.${fileExt}`;
        const filePath = `${user.id}/${propertyId}/${fileName}`;

        // Upload file to storage
        const { error: uploadError } = await supabase.storage
          .from('property-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Save photo record to database
        const { error: dbError } = await supabase
          .from('property_photos')
          .insert({
            property_id: propertyId,
            file_path: filePath,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
            alt_text: altText || file.name,
            display_order: photos.length + i,
            is_primary: photos.length === 0 && i === 0 // First photo is primary if no photos exist
          });

        if (dbError) throw dbError;
      }

      toast({
        title: "Success",
        description: `${selectedFiles.length} photo(s) uploaded successfully!`,
      });

      setShowUpload(false);
      setSelectedFiles(null);
      setAltText('');
      fetchPhotos();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photo: PropertyPhoto) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('property-photos')
        .remove([photo.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('property_photos')
        .delete()
        .eq('id', photo.id);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Photo deleted successfully!",
      });

      fetchPhotos();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    try {
      // Remove primary flag from all photos
      await supabase
        .from('property_photos')
        .update({ is_primary: false })
        .eq('property_id', propertyId);

      // Set selected photo as primary
      const { error } = await supabase
        .from('property_photos')
        .update({ is_primary: true })
        .eq('id', photoId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Primary photo updated!",
      });

      fetchPhotos();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getPhotoUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('property-photos')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p>Loading photos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Photo Gallery</h3>
          <p className="text-sm text-muted-foreground">Showcase your property with beautiful photos</p>
        </div>
        <Dialog open={showUpload} onOpenChange={setShowUpload}>
          <DialogTrigger asChild>
            <Button className="organic-hover">
              <Upload className="h-4 w-4 mr-2" />
              Upload Photos
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle>Upload Property Photos</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="photos">Select Photos</Label>
                <Input
                  id="photos"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setSelectedFiles(e.target.files)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  You can select multiple photos. Supported formats: JPG, PNG, WebP
                </p>
              </div>
              
              <div>
                <Label htmlFor="alt_text">Alt Text (Optional)</Label>
                <Input
                  id="alt_text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe the photos for accessibility"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowUpload(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleFileUpload} 
                  disabled={!selectedFiles || uploading}
                  className="organic-hover"
                >
                  {uploading ? 'Uploading...' : 'Upload Photos'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {photos.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <Card key={photo.id} className="glass-card organic-hover overflow-hidden">
              <div className="relative">
                <img
                  src={getPhotoUrl(photo.file_path)}
                  alt={photo.alt_text || photo.file_name}
                  className="w-full h-48 object-cover"
                />
                {photo.is_primary && (
                  <Badge className="absolute top-2 left-2 bg-primary">
                    <Star className="h-3 w-3 mr-1" />
                    Primary
                  </Badge>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {!photo.is_primary && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSetPrimary(photo.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeletePhoto(photo)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="text-sm font-medium truncate">{photo.file_name}</p>
                {photo.alt_text && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {photo.alt_text}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Camera className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No photos yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Upload photos to showcase your property to potential guests.
            </p>
            <Button onClick={() => setShowUpload(true)} className="organic-hover">
              <Upload className="h-4 w-4 mr-2" />
              Upload Your First Photos
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PhotoGallery;