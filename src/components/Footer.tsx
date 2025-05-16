"use client";

import { useState, useEffect } from 'react';

export function Footer() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border mt-12">
      © {currentYear} ABASBlogs. All rights reserved.
    </footer>
  );
}
