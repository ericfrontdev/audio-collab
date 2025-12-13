import { Music, Users, Repeat, MessageSquare, Layers, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import WaitlistForm from '@/components/WaitlistForm'
import Link from 'next/link'
import Image from 'next/image'

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ backgroundColor: '#1a1817' }}>
        <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(white,transparent_85%)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 sm:pb-32">
          {/* Logo + Name at top */}
          <div className="flex items-center justify-center gap-3 mb-[120px]">
            <Image
              src="/images/AC_Logo.webp"
              alt="AudioCollab"
              width={64}
              height={64}
              className="object-contain"
            />
            <span className="text-3xl font-bold text-white">
              AudioCollab
            </span>
          </div>

          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="flex justify-center">
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                🎵 Beta Launch - Free for Early Adopters
              </Badge>
            </div>

            {/* Title */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="block text-foreground">Collaborate on Music</span>
              <span className="block bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                With Producers Worldwide
              </span>
            </h1>

            {/* Subtitle */}
            <p className="max-w-2xl mx-auto text-xl text-muted-foreground">
              Upload stems, join clubs, remix tracks, and build music together.
              Your online music studio.
            </p>

            {/* Waitlist Form */}
            <div className="max-w-md mx-auto pt-4">
              <WaitlistForm locale={locale} />
            </div>

            {/* Social Proof */}
            <p className="text-sm text-muted-foreground">
              🎁 First 1,000 users get lifetime perks
            </p>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Problem */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-foreground">
                Tired of the Old Way?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-destructive">❌</div>
                  <div>
                    <p className="font-medium text-foreground">Emailing stems back and forth</p>
                    <p className="text-sm text-muted-foreground">Losing files in endless email threads</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-destructive">❌</div>
                  <div>
                    <p className="font-medium text-foreground">Lost in Dropbox folders</p>
                    <p className="text-sm text-muted-foreground">No organization, no version control</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-destructive">❌</div>
                  <div>
                    <p className="font-medium text-foreground">No feedback on specific parts</p>
                    <p className="text-sm text-muted-foreground">&ldquo;Love the track!&rdquo; isn&apos;t enough</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Solution */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-foreground">
                AudioCollab Fixes This
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-primary">✅</div>
                  <div>
                    <p className="font-medium text-foreground">Upload & organize stems</p>
                    <p className="text-sm text-muted-foreground">Vocals, drums, bass - all in one place</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-primary">✅</div>
                  <div>
                    <p className="font-medium text-foreground">Comment on timestamps</p>
                    <p className="text-sm text-muted-foreground">&ldquo;Love the drop at 1:32!&rdquo;</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-primary">✅</div>
                  <div>
                    <p className="font-medium text-foreground">Version control built-in</p>
                    <p className="text-sm text-muted-foreground">Track every change, never lose progress</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for modern music collaboration
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Multi-stem Projects</h3>
              <p className="text-muted-foreground">
                Upload vocals, drums, bass separately. Solo/mute each track.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Timeline Comments</h3>
              <p className="text-muted-foreground">
                Comment at specific timestamps. Precise feedback where it matters.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Repeat className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Remix Anything</h3>
              <p className="text-muted-foreground">
                Download stems and create your own version. Track remix chains.
              </p>
            </Card>

            {/* Feature 4 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Genre-based Clubs</h3>
              <p className="text-muted-foreground">
                Join Hip-Hop, EDM, Jazz clubs. Collaborate with your community.
              </p>
            </Card>

            {/* Feature 5 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Online DAW (Coming)</h3>
              <p className="text-muted-foreground">
                Full production studio in your browser. Real-time collaboration.
              </p>
            </Card>

            {/* Feature 6 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Music className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Bilingual</h3>
              <p className="text-muted-foreground">
                Full support for English and French. More languages coming.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="py-20 bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Our Roadmap
            </h2>
            <p className="text-xl text-muted-foreground">
              Building in public. Here&apos;s what&apos;s coming.
            </p>
          </div>

          <div className="space-y-8">
            {/* Phase 1 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-primary-foreground">1</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-semibold">Phase 1 - Beta</h3>
                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">In Progress</Badge>
                </div>
                <p className="text-muted-foreground mb-3">
                  Core collaboration features
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Upload projects</Badge>
                  <Badge variant="secondary">Clubs</Badge>
                  <Badge variant="secondary">Discussions</Badge>
                  <Badge variant="secondary">Remixes</Badge>
                </div>
              </div>
            </div>

            {/* Phase 2 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-secondary-foreground">2</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-semibold">Phase 2 - Multitrack</h3>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>
                <p className="text-muted-foreground mb-3">
                  Professional multitrack features
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Multi-stem upload</Badge>
                  <Badge variant="secondary">Waveforms</Badge>
                  <Badge variant="secondary">Basic mixing</Badge>
                  <Badge variant="secondary">Solo/mute</Badge>
                </div>
              </div>
            </div>

            {/* Phase 3 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-muted-foreground">3</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-semibold">Phase 3 - DAW</h3>
                  <Badge variant="outline">Future</Badge>
                </div>
                <p className="text-muted-foreground mb-3">
                  Full online DAW (AudioCollab Studio)
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Timeline editing</Badge>
                  <Badge variant="secondary">Effects</Badge>
                  <Badge variant="secondary">MIDI</Badge>
                  <Badge variant="secondary">Real-time collab</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-b from-background to-primary/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Collaborate?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join the waitlist and be among the first to experience AudioCollab.
          </p>
          <div className="max-w-md mx-auto">
            <WaitlistForm locale={locale} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/images/AC_Logo.webp"
                alt="AudioCollab"
                width={32}
                height={32}
                className="object-contain"
              />
              <span className="font-semibold text-lg">AudioCollab</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href={`/${locale}/privacy`} className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href={`/${locale}/terms`} className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <a href="mailto:hello@audiocollab.app" className="hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            © 2024 AudioCollab. Built with 💜 for music creators.
          </div>
        </div>
      </footer>
    </div>
  )
}
