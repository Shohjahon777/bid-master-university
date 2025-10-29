'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FileUpload } from '@/components/file-upload'
import { useFileUpload } from '@/hooks/use-file-upload'
import { createAuction } from '@/lib/actions/auctions'
import { AuctionCategory } from '@/types'
import { 
  createAuctionSchema, 
  type CreateAuctionData,
  VALIDATION_MESSAGES 
} from '@/lib/validations/auction'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const CATEGORIES = [
  { value: 'ELECTRONICS', label: 'Electronics' },
  { value: 'CLOTHING', label: 'Clothing' },
  { value: 'BOOKS', label: 'Books' },
  { value: 'FURNITURE', label: 'Furniture' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'JEWELRY', label: 'Jewelry' },
  { value: 'ART', label: 'Art' },
  { value: 'COLLECTIBLES', label: 'Collectibles' },
  { value: 'VEHICLES', label: 'Vehicles' },
  { value: 'OTHER', label: 'Other' }
]

const CONDITIONS = [
  { value: 'New', label: 'New' },
  { value: 'Like New', label: 'Like New' },
  { value: 'Good', label: 'Good' },
  { value: 'Fair', label: 'Fair' },
  { value: 'Poor', label: 'Poor' }
]

const DURATIONS = [
  { value: '1', label: '1 Day' },
  { value: '3', label: '3 Days' },
  { value: '7', label: '1 Week' },
  { value: '14', label: '2 Weeks' }
]

export function AuctionForm() {
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  
  const { uploadAuctionImages, isUploading, progress, error: uploadError } = useFileUpload({
    onSuccess: (urls) => {
      console.log('Images uploaded:', urls)
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error}`)
    }
  })

  const form = useForm<CreateAuctionData>({
    resolver: zodResolver(createAuctionSchema),
    defaultValues: {
      title: '',
      description: '',
      category: AuctionCategory.OTHER,
      condition: 'Good',
      startingPrice: 0,
      buyNowPrice: undefined,
      duration: '7',
      images: []
    }
  })

  const onSubmit = async (data: CreateAuctionData) => {
    setIsSubmitting(true)
    
    try {
      // First create the auction
      const formData = new FormData()
      formData.append('title', data.title)
      formData.append('description', data.description)
      formData.append('category', data.category)
      formData.append('condition', data.condition)
      formData.append('startingPrice', data.startingPrice.toString())
      if (data.buyNowPrice) {
        formData.append('buyNowPrice', data.buyNowPrice.toString())
      }
      formData.append('duration', data.duration)
      formData.append('images', JSON.stringify(data.images))

      const result = await createAuction(formData)
      
      if (!result.success) {
        toast.error(result.error || 'Failed to create auction')
        return
      }

      // Upload images if any
      if (files.length > 0 && result.auction) {
        const uploadResult = await uploadAuctionImages(result.auction.id, files)
        
        if (uploadResult.success && uploadResult.urls) {
          // Update auction with image URLs
          // You would need to create an updateAuction action for this
          console.log('Images uploaded successfully:', uploadResult.urls)
        }
      }

      toast.success('Auction created successfully!')
      router.push(`/auctions/${result.auction?.id}`)
    } catch (error) {
      console.error('Error creating auction:', error)
      toast.error('Failed to create auction')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Auction</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter auction title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your item in detail..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category and Condition */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condition</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONDITIONS.map((condition) => (
                          <SelectItem key={condition.value} value={condition.value}>
                            {condition.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Price Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startingPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starting Price ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="buyNowPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buy Now Price ($) - Optional</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Duration */}
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Auction Duration</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DURATIONS.map((duration) => (
                        <SelectItem key={duration.value} value={duration.value}>
                          {duration.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload */}
            <div className="space-y-2">
              <FormLabel>Images (Optional)</FormLabel>
              <FileUpload
                files={files}
                onFilesChange={setFiles}
                maxFiles={5}
                maxSize={5}
                acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
              />
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading images...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Upload Error */}
            {uploadError && (
              <div className="text-sm text-destructive">
                {uploadError}
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Auction...
                </>
              ) : (
                'Create Auction'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
