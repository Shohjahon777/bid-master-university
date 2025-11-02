'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { uploadMultipleFiles, STORAGE_BUCKETS } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileUpload } from '@/components/file-upload'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  createAuctionSchema, 
  type CreateAuctionData,
  VALIDATION_MESSAGES 
} from '@/lib/validations/auction'
import { AuctionCategory } from '@/types'
import { createAuction } from './actions'
import { toast } from 'sonner'
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Image as ImageIcon,
  X,
  Upload,
  DollarSign,
  Clock,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { value: 'ELECTRONICS', label: 'Electronics', icon: '📱' },
  { value: 'CLOTHING', label: 'Clothing', icon: '👕' },
  { value: 'BOOKS', label: 'Books', icon: '📚' },
  { value: 'FURNITURE', label: 'Furniture', icon: '🪑' },
  { value: 'SPORTS', label: 'Sports', icon: '⚽' },
  { value: 'JEWELRY', label: 'Jewelry', icon: '💍' },
  { value: 'ART', label: 'Art', icon: '🎨' },
  { value: 'COLLECTIBLES', label: 'Collectibles', icon: '🏆' },
  { value: 'VEHICLES', label: 'Vehicles', icon: '🚗' },
  { value: 'OTHER', label: 'Other', icon: '📦' }
]

const CONDITIONS = [
  { value: 'New', label: 'New', description: 'Brand new, never used' },
  { value: 'Like New', label: 'Like New', description: 'Minimal wear, excellent condition' },
  { value: 'Good', label: 'Good', description: 'Some wear, but fully functional' },
  { value: 'Fair', label: 'Fair', description: 'Noticeable wear, still usable' },
  { value: 'Poor', label: 'Poor', description: 'Heavy wear, may need repair' }
]

const DURATIONS = [
  { value: '1', label: '1 Day', description: 'Quick auction' },
  { value: '3', label: '3 Days', description: 'Short auction' },
  { value: '7', label: '1 Week', description: 'Standard auction' },
  { value: '14', label: '2 Weeks', description: 'Extended auction' }
]

const STEPS = [
  { id: 1, title: 'Basic Info', description: 'Item details', icon: '📝' },
  { id: 2, title: 'Images', description: 'Add photos', icon: '📸' },
  { id: 3, title: 'Pricing', description: 'Set prices', icon: '💰' }
] as const

type Step = typeof STEPS[number]['id']

export default function CreateAuctionPage() {
  // All hooks must be called unconditionally
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { user, loading } = useAuth()
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
  const watchedValues = form.watch()

  // Handle authentication
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirect to login with return URL
        const loginUrl = new URL('/login', window.location.origin)
        loginUrl.searchParams.set('redirectTo', '/auctions/new')
        router.push(loginUrl.toString())
        return
      }
      setIsLoading(false)
    }
  }, [user, loading, router])

  // Show loading while checking authentication
  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null
  }

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1 as Step)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1 as Step)
    }
  }

  const handleImageUpload = async (files: File[]) => {
    // Store uploaded files
    setUploadedFiles(files)
    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      // Create blob URLs for immediate preview
      const blobUrls = files.map(file => URL.createObjectURL(file))
      
      setUploadedImages(prev => {
        const updatedImages = [...prev, ...blobUrls]
        setTimeout(() => {
          form.setValue('images', updatedImages)
        }, 0)
        return updatedImages
      })
      
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            setIsUploading(false)
            return 100
          }
          return prev + 20
        })
      }, 100)
      
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('Failed to upload images')
      setIsUploading(false)
    }
  }

  const removeImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index)
    const newFiles = uploadedFiles.filter((_, i) => i !== index)
    setUploadedImages(newImages)
    setUploadedFiles(newFiles)
    form.setValue('images', newImages)
  }

  const onSubmit = async (data: CreateAuctionData) => {
    setIsSubmitting(true)
    
    try {
      // Prepare form data for server action
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
      formData.append('images', JSON.stringify(['https://placehold.co/600x400?text=Uploading...']))

      // Call server action to create auction
      const result = await createAuction(formData)
      
      if (result.success && result.auction) {
        // Upload images to Supabase Storage after auction creation
        if (uploadedFiles.length > 0) {
          try {
            const uploadResult = await uploadMultipleFiles(
              STORAGE_BUCKETS.AUCTION_IMAGES,
              uploadedFiles,
              `auctions/${result.auction.id}`
            )
            
            if (uploadResult.success && uploadResult.urls) {
              // Update auction with uploaded image URLs
              await supabase.from('auctions').update({ images: uploadResult.urls }).eq('id', result.auction.id)
            } else {
              console.error('Upload failed:', uploadResult.error)
            }
          } catch (uploadError) {
            console.error('Error uploading images:', uploadError)
            // Don't fail the whole operation if upload fails
          }
        }
        
        // Show success toast
        toast.success(result.message || 'Auction created successfully!')
        
        // Redirect to auction detail page
        router.push(`/auctions/${result.auction.id}`)
      } else {
        // Show error toast
        toast.error(result.error || 'Failed to create auction')
        console.error('Auction creation failed:', result.details)
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isStepValid = (step: Step): boolean => {
    switch (step) {
      case 1:
        return !!(watchedValues.title && watchedValues.description && watchedValues.category && watchedValues.condition)
      case 2:
        return uploadedImages.length > 0
      case 3:
        return !!(watchedValues.startingPrice && watchedValues.duration)
      default:
        return false
    }
  }

  const progressPercentage = (currentStep / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Create New Auction</h1>
          <p className="text-muted-foreground">
            List your item and start bidding in minutes
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                  currentStep >= step.id
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-background border-muted-foreground text-muted-foreground"
                )}>
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={cn(
                    "text-sm font-medium",
                    currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    "w-12 h-0.5 mx-4 transition-colors",
                    currentStep > step.id ? "bg-primary" : "bg-muted-foreground"
                  )} />
                )}
              </div>
            ))}
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
            const firstError = Object.values(errors)[0]
            if (firstError?.message) {
              toast.error(String(firstError.message))
            }
          })} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{STEPS[currentStep - 1].icon}</span>
                  {STEPS[currentStep - 1].title}
                </CardTitle>
                <p className="text-muted-foreground">
                  {STEPS[currentStep - 1].description}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: Basic Info */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    {/* Title */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Title *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter a descriptive title for your item"
                              {...field}
                            />
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
                          <FormLabel>Description *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your item in detail. Include any flaws, accessories, or special features."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Category and Condition */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {CATEGORIES.map((category) => (
                                  <SelectItem key={category.value} value={category.value}>
                                    <div className="flex items-center gap-2">
                                      <span>{category.icon}</span>
                                      <span>{category.label}</span>
                                    </div>
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
                            <FormLabel>Condition *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select condition" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {CONDITIONS.map((condition) => (
                                  <SelectItem key={condition.value} value={condition.value}>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{condition.label}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {condition.description}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Images */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    {/* Image Upload */}
                    <div>
                      <FormLabel>Item Photos *</FormLabel>
                      <p className="text-sm text-muted-foreground mb-4">
                        Add 1-5 photos of your item. First photo will be the main image.
                      </p>
                      <FileUpload
                        files={uploadedFiles}
                        onFilesChange={handleImageUpload}
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
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}

                    {/* Image Preview */}
                    {uploadedImages.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Uploaded Images ({uploadedImages.length}/5)</h3>
                          <Badge variant="outline">
                            {uploadedImages.length === 1 ? '1 image' : `${uploadedImages.length} images`}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                          {uploadedImages.map((url, index) => (
                            <div key={index} className="relative group">
                              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                                <img
                                  src={url}
                                  alt={`Upload ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeImage(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                              {index === 0 && (
                                <Badge className="absolute bottom-2 left-2 text-xs">
                                  Main
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Validation Message */}
                    {uploadedImages.length === 0 && (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        <ImageIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
                        <p>Upload at least one image to continue</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Pricing */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    {/* Starting Price */}
                    <FormField
                      control={form.control}
                      name="startingPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Starting Price *
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="pl-8"
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Buy Now Price */}
                    <FormField
                      control={form.control}
                      name="buyNowPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Buy Now Price (Optional)
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="pl-8"
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              />
                            </div>
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            Allow buyers to purchase immediately at this price
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Duration */}
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Auction Duration *
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select duration" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DURATIONS.map((duration) => (
                                <SelectItem key={duration.value} value={duration.value}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{duration.label}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {duration.description}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Summary */}
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <h4 className="font-medium">Auction Summary</h4>
                      <div className="text-sm space-y-1">
                        <p><span className="text-muted-foreground">Title:</span> {watchedValues.title || 'Not set'}</p>
                        <p><span className="text-muted-foreground">Category:</span> {CATEGORIES.find(c => c.value === watchedValues.category)?.label || 'Not set'}</p>
                        <p><span className="text-muted-foreground">Condition:</span> {watchedValues.condition || 'Not set'}</p>
                        <p><span className="text-muted-foreground">Starting Price:</span> ${watchedValues.startingPrice || '0.00'}</p>
                        {watchedValues.buyNowPrice && (
                          <p><span className="text-muted-foreground">Buy Now Price:</span> ${watchedValues.buyNowPrice}</p>
                        )}
                        <p><span className="text-muted-foreground">Duration:</span> {DURATIONS.find(d => d.value === watchedValues.duration)?.label || 'Not set'}</p>
                        <p><span className="text-muted-foreground">Images:</span> {uploadedImages.length} uploaded</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1 || isSubmitting}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!isStepValid(currentStep) || isSubmitting}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={!isStepValid(3) || isSubmitting}
                    className="flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Create Auction
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
