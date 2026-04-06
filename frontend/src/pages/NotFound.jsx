import React from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'

export default function NotFound() {
  return (
    <div className="min-h-screen subtle-grid flex items-center justify-center p-6">
      <div className="card p-8 max-w-lg w-full text-center">
        <div className="display text-6xl text-primary">404</div>
        <div className="mt-2 text-foreground/80">This page does not exist.</div>
        <div className="mt-6">
          <Link to="/">
            <Button size="xl" className="display w-full">
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

