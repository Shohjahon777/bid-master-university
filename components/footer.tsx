"use client"

import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

const footerLinks = {
  about: [
    { name: "About Us", href: "/about" },
    { name: "How It Works", href: "/how-it-works" },
    { name: "Success Stories", href: "/success-stories" },
    { name: "Careers", href: "/careers" },
  ],
  support: [
    { name: "Help Center", href: "/help" },
    { name: "Contact Us", href: "/contact" },
    { name: "Report Issue", href: "/report" },
    { name: "Feedback", href: "/feedback" },
  ],
  legal: [
    { name: "Terms of Service", href: "/terms" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Cookie Policy", href: "/cookies" },
    { name: "User Agreement", href: "/agreement" },
  ],
  university: [
    { name: "University Portal", href: "/university" },
    { name: "Student Services", href: "/services" },
    { name: "Academic Calendar", href: "/calendar" },
    { name: "Campus Map", href: "/campus" },
  ],
}

const socialLinks = [
  { name: "Facebook", href: "#", icon: Facebook },
  { name: "Twitter", href: "#", icon: Twitter },
  { name: "Instagram", href: "#", icon: Instagram },
  { name: "LinkedIn", href: "#", icon: Linkedin },
]

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* University Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">B</span>
              </div>
              <div>
                <h3 className="text-lg font-bold">Bid Master</h3>
                <p className="text-sm text-muted-foreground">University Platform</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              The internal university auction platform where students can list items, 
              discover unique finds, and bid on exciting auctions within your campus community.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>University Campus, Student Center</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>support@bidmaster.university</span>
              </div>
            </div>
          </div>

          {/* About Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4">About</h4>
            <ul className="space-y-3">
              {footerLinks.about.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & University Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Legal & University</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <h5 className="text-xs font-medium text-muted-foreground mb-2">University</h5>
                <ul className="space-y-2">
                  {footerLinks.university.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="py-8 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <h4 className="text-lg font-semibold mb-2">Stay Updated</h4>
              <p className="text-sm text-muted-foreground">
                Get notified about new auctions and exciting opportunities.
              </p>
            </div>
            <div className="flex w-full md:w-auto space-x-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-64 px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              <Button size="sm">Subscribe</Button>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="py-6 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-sm text-muted-foreground text-center md:text-left">
              <p>
                © {currentYear} Bid Master University Platform. All rights reserved.
              </p>
              <p className="mt-1">
                Built for students, by students. Internal use only.
              </p>
            </div>

            {/* Social Media Links */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Follow us:</span>
              <div className="flex space-x-2">
                {socialLinks.map((social) => {
                  const Icon = social.icon
                  return (
                    <Button
                      key={social.name}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      asChild
                    >
                      <Link
                        href={social.href}
                        aria-label={social.name}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Icon className="h-4 w-4" />
                      </Link>
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* University Disclaimer */}
        <div className="py-4 border-t border-border bg-muted/30">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              This platform is exclusively for university students and staff. 
              All transactions are subject to university policies and local regulations.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
