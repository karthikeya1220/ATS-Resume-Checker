"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
  Briefcase,
  Building,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  CalendarIcon,
  ClockIcon,
  Globe,
  Award,
  Bookmark,
  Share2,
  FileText,
  BarChart4,
  Layers,
  Sparkles,
  Zap,
  Users,
  AlertCircle,
  Trash2,
  Edit,
  ExternalLink,
} from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ShowRelevantCandidatesButton } from "@/components/show-relevant-candidates-button"
import { toast } from "@/components/ui/use-toast"
import type { Job } from "@/types/jobs"
import { useRouter } from "next/navigation"
import apiClient from "@/lib/api-client"

interface JobDetailsSheetProps {
  job: Job | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onJobUpdate: (updatedJob: Job) => void
  currentUserId?: string
  onDeleteJob?: (jobId: string) => void
}

export function JobDetailsSheet({
  job,
  isOpen,
  onOpenChange,
  onJobUpdate,
  currentUserId,
  onDeleteJob,
}: JobDetailsSheetProps) {
  const [isAssigning, setIsAssigning] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const router = useRouter()

  if (!job) return null

  const isJobCreator = currentUserId && job.metadata && job.metadata.created_by_id === currentUserId

  const totalApplications = job.total_applications || 0
  const applicationProgress = totalApplications > 0 ? Math.round((job.shortlisted / totalApplications) * 100) : 0

  const hasApplicationData = totalApplications > 0

  const handleAssignJob = async () => {
    if (!job || !currentUserId) return

    setIsAssigning(true)
    try {
      await apiClient.jobs.assignRecruiters(job.job_id, [currentUserId])

      toast({
        title: "Success",
        description: "Job assigned successfully!",
      })

      const updatedJob = {
        ...job,
        assigned_recruiters: [...(job.assigned_recruiters || []), currentUserId],
      }
      onJobUpdate(updatedJob)
    } catch (error) {
      console.error("Error assigning job:", error)
      toast({
        title: "Error",
        description: "Failed to assign job",
        variant: "destructive",
      })
    } finally {
      setIsAssigning(false)
    }
  }

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    toast({
      title: isBookmarked ? "Removed from bookmarks" : "Added to bookmarks",
      description: isBookmarked ? "Job has been removed from your bookmarks" : "Job has been added to your bookmarks",
    })
  }

  const shareJob = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${job.title} at ${job.company}`,
          text: `Check out this job: ${job.title} at ${job.company}`,
          url: window.location.href,
        })
        .catch((err) => {
          console.error("Error sharing:", err)
        })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied",
        description: "Job link has been copied to clipboard",
      })
    }
  }

  const handleDeleteJob = async () => {
    if (!job || !currentUserId) return

    setIsDeleting(true)
    try {
      await apiClient.jobs.delete(job.job_id)

      toast({
        title: "Success",
        description: "Job deleted successfully",
      })

      if (onDeleteJob) {
        onDeleteJob(job.job_id)
      }

      onOpenChange(false)
      router.push("/job")
    } catch (error) {
      console.error("Error deleting job:", error)
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const navigateToEditJob = () => {
    router.push(`/edit-job/${job.job_id}`)
    onOpenChange(false)
  }

  const navigateToCandidates = () => {
    router.push(`/jobs/${job.job_id}/candidates`)
    onOpenChange(false)
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl p-0 overflow-y-auto">
          <div className="sticky top-0 z-10 bg-background border-b shadow-sm">
            <div className="p-6 pb-4">
              <SheetHeader className="mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2.5 rounded-md">
                      <Briefcase className="h-5 w-5 text-primary" />
                    </div>
                    <SheetTitle className="text-2xl font-bold tracking-tight">{job.title}</SheetTitle>
                  </div>
                  <Badge 
                    variant={job.status === "active" ? "default" : "destructive"} 
                    className="ml-2 self-start sm:self-auto px-2.5 py-1 text-xs font-medium rounded-full"
                  >
                    {job.status === "active" ? (
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    {job.status}
                  </Badge>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3">
                  <SheetDescription className="flex items-center text-base">
                    <Building className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="font-medium text-foreground/80">{job.company}</span>
                  </SheetDescription>
                  
                  <div className="flex items-center gap-1 mt-2 sm:mt-0">
                    {isJobCreator && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowDeleteDialog(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete job</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    {isJobCreator && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-primary/10"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigateToEditJob()
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit job</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-primary/10"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleBookmark()
                            }}
                          >
                            <Bookmark className={`h-4 w-4 transition-colors ${isBookmarked ? "fill-primary text-primary" : ""}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-primary/10"
                            onClick={(e) => {
                              e.stopPropagation()
                              shareJob()
                            }}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Share job</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </SheetHeader>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 bg-muted/30 p-3 rounded-lg">
                {job.location && (
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground mb-1">Location</span>
                    <span className="text-sm font-medium flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                      {job.location}
                    </span>
                  </div>
                )}
                {job.employment_type && (
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground mb-1">Job Type</span>
                    <span className="text-sm font-medium flex items-center">
                      <Briefcase className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                      {job.employment_type}
                    </span>
                  </div>
                )}
                {job.experience_required && (
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground mb-1">Experience</span>
                    <span className="text-sm font-medium flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                      {job.experience_required}
                    </span>
                  </div>
                )}
                {job.salary_range && (
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground mb-1">Salary</span>
                    <span className="text-sm font-medium flex items-center">
                      <DollarSign className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                      {job.salary_range}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start rounded-none border-b p-0 h-auto bg-transparent">
                <TabsTrigger
                  value="overview"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium transition-colors data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium transition-colors data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
                >
                  Details
                </TabsTrigger>
                {hasApplicationData && (
                  <TabsTrigger
                    value="stats"
                    className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium transition-colors data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
                  >
                    Stats
                  </TabsTrigger>
                )}
              </TabsList>
            
              <div className="job-content overflow-y-auto">
                <TabsContent value="overview" className="p-6 pt-5 space-y-6 m-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Job Summary
                      </h3>
                      {job.deadline && (
                        <Badge variant="outline" className="flex items-center gap-1 rounded-full">
                          <CalendarIcon className="h-3 w-3" />
                          Deadline: {job.deadline}
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">{job.description}</p>
                  </div>

                  <Separator className="my-6" />

                  {(job.working_hours || job.mode_of_work) && (
                    <>
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Layers className="h-4 w-4 text-primary" />
                          Key Details
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {job.working_hours && (
                            <div className="flex items-start gap-3 bg-muted/30 p-3 rounded-lg">
                              <div className="bg-background p-2 rounded-md">
                                <ClockIcon className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">Working Hours</p>
                                <p className="text-sm text-muted-foreground">{job.working_hours}</p>
                              </div>
                            </div>
                          )}
                          {job.mode_of_work && (
                            <div className="flex items-start gap-3 bg-muted/30 p-3 rounded-lg">
                              <div className="bg-background p-2 rounded-md">
                                <Globe className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">Work Mode</p>
                                <p className="text-sm text-muted-foreground">{job.mode_of_work}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <Separator className="my-6" />
                    </>
                  )}

                  {job.skills_required && job.skills_required.length > 0 && (
                    <>
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Zap className="h-4 w-4 text-primary" />
                          Required Skills
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {job.skills_required.map((skill, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="px-2.5 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border-none"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Separator className="my-6" />
                    </>
                  )}

                  {job.nice_to_have_skills && job.nice_to_have_skills.length > 0 && (
                    <>
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          Nice to Have Skills
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {job.nice_to_have_skills.map((skill, index) => (
                            <Badge 
                              key={index} 
                              variant="outline" 
                              className="px-2.5 py-1 text-xs font-medium rounded-full border-dashed"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Separator className="my-6" />
                    </>
                  )}

                  {hasApplicationData && (
                    <div className="space-y-4 bg-muted/20 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <BarChart4 className="h-4 w-4 text-primary" />
                          Application Progress
                        </h3>
                        <span className="text-sm font-medium bg-muted/50 px-2.5 py-1 rounded-full">
                          {job.shortlisted} of {totalApplications} applications
                        </span>
                      </div>
                      <div className="space-y-2">
                        <Progress value={applicationProgress} className="h-2 bg-muted" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>0%</span>
                          <span className="text-primary font-medium">{applicationProgress}% shortlisted</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="details" className="p-6 pt-5 space-y-6 m-0">
                  {job.requirements && job.requirements.length > 0 && (
                    <>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">Requirements</h3>
                        </div>
                        <ul className="space-y-2 pl-6 text-sm">
                          {job.requirements.map((req, index) => (
                            <li key={index} className="text-muted-foreground list-disc leading-relaxed">
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Separator className="my-6" />
                    </>
                  )}
                </TabsContent>

                {hasApplicationData && (
                  <TabsContent value="stats" className="p-6 pt-5 space-y-6 m-0">
                    <div className="space-y-5">
                      <div className="flex items-center gap-2">
                        <BarChart4 className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Application Statistics</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Card className="border shadow-sm bg-background hover:shadow-md transition-shadow duration-200">
                          <CardContent className="p-4 flex flex-col items-center justify-center">
                            <Users className="h-8 w-8 text-primary/80 mb-2" />
                            <p className="text-3xl font-bold">{job.total_applications || 0}</p>
                            <p className="text-sm text-muted-foreground">Total Applications</p>
                          </CardContent>
                        </Card>
                        <Card className="border shadow-sm bg-background hover:shadow-md transition-shadow duration-200">
                          <CardContent className="p-4 flex flex-col items-center justify-center">
                            <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                            <p className="text-3xl font-bold text-green-600 dark:text-green-500">
                              {job.shortlisted || 0}
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-500">Shortlisted</p>
                          </CardContent>
                        </Card>
                        <Card className="border shadow-sm bg-background hover:shadow-md transition-shadow duration-200">
                          <CardContent className="p-4 flex flex-col items-center justify-center">
                            <AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
                            <p className="text-3xl font-bold text-amber-600 dark:text-amber-500">
                              {job.in_progress || 0}
                            </p>
                            <p className="text-sm text-amber-600 dark:text-amber-500">In Progress</p>
                          </CardContent>
                        </Card>
                        <Card className="border shadow-sm bg-background hover:shadow-md transition-shadow duration-200">
                          <CardContent className="p-4 flex flex-col items-center justify-center">
                            <XCircle className="h-8 w-8 text-red-500 mb-2" />
                            <p className="text-3xl font-bold text-red-600 dark:text-red-500">{job.rejected || 0}</p>
                            <p className="text-sm text-red-600 dark:text-red-500">Rejected</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Candidate Management</h3>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2 py-5 border-dashed hover:border-primary hover:text-primary transition-colors"
                        onClick={navigateToCandidates}
                      >
                        <ExternalLink className="h-4 w-4" />
                        View All Candidates for This Job
                      </Button>
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Application Progress</h3>
                      </div>
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium flex items-center gap-1.5">
                              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                              Shortlisted
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {totalApplications > 0 ? Math.round((job.shortlisted / totalApplications) * 100) : 0}%
                            </span>
                          </div>
                          <Progress
                            value={totalApplications > 0 ? (job.shortlisted / totalApplications) * 100 : 0}
                            className="h-2 bg-muted"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium flex items-center gap-1.5">
                              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                              In Progress
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {totalApplications > 0 ? Math.round((job.in_progress / totalApplications) * 100) : 0}%
                            </span>
                          </div>
                          <Progress
                            value={totalApplications > 0 ? (job.in_progress / totalApplications) * 100 : 0}
                            className="h-2 bg-muted"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium flex items-center gap-1.5">
                              <XCircle className="h-3.5 w-3.5 text-red-500" />
                              Rejected
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {totalApplications > 0 ? Math.round((job.rejected / totalApplications) * 100) : 0}%
                            </span>
                          </div>
                          <Progress
                            value={totalApplications > 0 ? (job.rejected / totalApplications) * 100 : 0}
                            className="h-2 bg-muted"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Assignment Status</h3>
                      </div>
                      <Card className="border border-muted shadow-sm hover:shadow-md transition-shadow duration-200">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Current Status</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {job.assigned_recruiters?.includes(currentUserId || "")
                                  ? "Assigned to you"
                                  : job.assigned_recruiters?.length
                                    ? `Assigned to ${job.assigned_recruiters.length} recruiter(s)`
                                    : "Not assigned"}
                              </p>
                            </div>
                            {job.assigned_recruiters?.length ? (
                              <div className="flex -space-x-2">
                                {job.assigned_recruiters.slice(0, 3).map((_, i) => (
                                  <Avatar key={i} className="border-2 border-background h-8 w-8">
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                      R{i + 1}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                                {job.assigned_recruiters.length > 3 && (
                                  <Avatar className="border-2 border-background h-8 w-8">
                                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                                      +{job.assigned_recruiters.length - 3}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                )}
              </div>
            </Tabs>
          </div>

          <div className="sticky bottom-0 bg-background border-t p-4 flex flex-col sm:flex-row justify-between gap-4 mt-auto">
            <ShowRelevantCandidatesButton jobId={job.job_id} />
            <Button
              onClick={handleAssignJob}
              disabled={isAssigning || (job.assigned_recruiters || []).includes(currentUserId || "")}
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-sm"
            >
              {isAssigning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Assigning...
                </>
              ) : (job.assigned_recruiters || []).includes(currentUserId || "") ? (
                "Already Assigned"
              ) : (
                "Assign to Recruiter"
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. This will permanently delete the job posting and remove all associated data
              from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-2">
            <AlertDialogCancel disabled={isDeleting} className="mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteJob()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete Job"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

