function Footer() {
  return (
    <footer className='border-t bg-background'>
      <div className='mx-auto flex min-h-14 max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8'>
        <p className='text-xs text-muted-foreground'>
          © {new Date().getFullYear()} CSGE. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
