"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Briefcase, GraduationCap, Clock, Eye, Download } from "lucide-react"

interface ResumeAnalysis {
  name: string
  education_details: Array<{
    institute: string
    degree: string
    major: string
    location: string
    dates: string
  }>
  work_experience_details: Array<{
    company: string
    title: string
    location: string
    dates: string
    responsibilities: string[]
  }>
  key_skills: string[]
  profile_summary: string
  experience_years?: number
}

interface Resume {
  filename: string
  filelink: string
  uploadedAt: Date
  analysis: ResumeAnalysis
}

interface ResumeCardProps {
  resume: Resume
  index: number
  selectedKeywords: string[]
  calculateMatchScore: (resume: Resume) => number
  onViewDetails: (resume: Resume) => void
  onDownload: (fileUrl: string, filename: string) => void
}

export function ResumeCard({
  resume,
  selectedKeywords,
  calculateMatchScore,
  onViewDetails,
  onDownload,
}: ResumeCardProps) {
  const [expandedSkills, setExpandedSkills] = useState(false)

  // Safely access nested properties
  const educationDetails = resume?.analysis?.education_details || []
  const workExperienceDetails = resume?.analysis?.work_experience_details || []
  const keySkills = resume?.analysis?.key_skills || []
  const name = resume?.analysis?.name || "Unnamed Candidate"
  const experienceYears = resume?.analysis?.experience_years

  // Toggle expanded skills
  const toggleExpandSkills = () => {
    setExpandedSkills(!expandedSkills)
  }

  // Check if a skill matches any selected keyword
  const isHighlighted = (skill: string) => {
    if (!selectedKeywords.length) return false
    return selectedKeywords.some((keyword) => skill && skill.toLowerCase().includes(keyword.toLowerCase()))
  }

  return (
    <Card className="overflow-hidden border border-violet-200/50 dark:border-violet-800/50 hover:shadow-md transition-all duration-200">
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-lg font-semibold text-violet-900 dark:text-violet-100">
                {name}
              </h3>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">

                {educationDetails[0]?.degree && (
                  <div className="flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                    <span>{educationDetails[0].degree}</span>
                  </div>
                )}
                {workExperienceDetails[0]?.title && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                    <span>{workExperienceDetails[0].title}</span>
                  </div>
                )}

                {experienceYears !== undefined && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                    <span>
                      {experienceYears} {experienceYears === 1 ? "year" : "years"}{" "}
                      experience
                    </span>
                  </div>
                )}
              </div>
            </div>

            {selectedKeywords.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium">Match Score:</div>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={calculateMatchScore(resume)} 
                    className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800" 
                  />
                  <span
                    className={`text-sm font-medium ${
                      calculateMatchScore(resume) > 80
                        ? "text-emerald-600 dark:text-emerald-400"
                        : calculateMatchScore(resume) > 50
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {calculateMatchScore(resume)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Skills section */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-violet-700 dark:text-violet-300 mb-2">Key Skills</h4>
            <div className="flex flex-wrap gap-1.5">

              {keySkills
                .slice(0, expandedSkills ? keySkills.length : 8)
                .map((skill, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className={`
                      px-2 py-0.5 text-xs font-medium
                      ${
                        isHighlighted(skill)
                          ? "bg-violet-100 dark:bg-violet-900/40 border-violet-300 dark:border-violet-700 text-violet-800 dark:text-violet-300"
                          : "bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700"
                      }
                    `}
                  >
                    {skill}
                  </Badge>
                ))}

              {keySkills.length > 8 && !expandedSkills && (
                <Badge
                  variant="outline"
                  className="px-2 py-0.5 text-xs cursor-pointer hover:bg-violet-50 dark:hover:bg-violet-900/20"
                  onClick={toggleExpandSkills}
                >
                  +{keySkills.length - 8} more
                </Badge>
              )}
              {expandedSkills && (
                <Badge
                  variant="outline"
                  className="px-2 py-0.5 text-xs cursor-pointer hover:bg-violet-50 dark:hover:bg-violet-900/20"
                  onClick={toggleExpandSkills}
                >
                  Show less
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Separator className="bg-violet-100 dark:bg-violet-800/50" />

        {/* Actions footer */}
        <div className="p-3 flex items-center justify-between bg-violet-50/50 dark:bg-violet-900/10">
          <div className="text-xs text-muted-foreground">
            Uploaded {resume.uploadedAt.toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-violet-200 dark:border-violet-800 hover:bg-violet-100 dark:hover:bg-violet-900/20"
              onClick={() => onViewDetails(resume)}
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              View Details
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white"
              onClick={() => onDownload(resume.filelink, resume.filename)}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download Resume
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

