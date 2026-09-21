import { useState } from "react";
import { ArrowRight, Building2, Check, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function Register() {
  const [memberCode, setMemberCode] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    console.log({
      memberCode,
      name,
      mobile,
      email,
      password,
      confirmPassword,
    });
  };

  return (
    <main className=' bg-muted/30'>
      <div className='grid lg:grid-cols-2'>
        {/* Left Section */}
        <section className='relative hidden overflow-hidden bg-primary lg:flex'>
          <div className='absolute inset-0'>
            <div className='absolute -left-32 -top-32  w-96 rounded-full bg-white/10 blur-3xl' />
            <div className='absolute -bottom-40 -right-20  w-[30rem] rounded-full bg-white/10 blur-3xl' />
            <div className='absolute left-1/2 top-1/2 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl' />
          </div>

          <div className='relative z-10 flex w-full flex-col justify-between p-12 xl:p-16'>
            <div className='max-w-xl'>
              <p className='mb-4 text-sm font-medium uppercase tracking-[0.2em] text-white/60'>
                Get started
              </p>

              <h1 className='text-4xl font-semibold tracking-tight text-white xl:text-5xl'>
                Create your account and get started.
              </h1>

              <p className='mt-6 max-w-lg text-base leading-7 text-white/70'>
                Register your member account to access the CSGE management
                system and manage your cooperative activities securely.
              </p>

              <div className='mt-10 space-y-4'>
                <div className='flex items-start gap-4'>
                  <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10'>
                    <Check className=' w-4 text-white' />
                  </div>

                  <div>
                    <p className='text-sm font-medium text-white'>
                      Simple registration
                    </p>
                    <p className='mt-1 text-xs leading-5 text-white/50'>
                      Enter your basic member information to get started.
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-4'>
                  <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10'>
                    <ShieldCheck className='h-4 w-4 text-white' />
                  </div>

                  <div>
                    <p className='text-sm font-medium text-white'>
                      Secure access
                    </p>
                    <p className='mt-1 text-xs leading-5 text-white/50'>
                      Your account is protected with secure authentication.
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-4'>
                  <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10'>
                    <Users className='h-4 w-4 text-white' />
                  </div>

                  <div>
                    <p className='text-sm font-medium text-white'>
                      Member management
                    </p>
                    <p className='mt-1 text-xs leading-5 text-white/50'>
                      Access member-related information from one place.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Register Form */}
        <section className='flex items-center justify-center px-4 py-6 sm:px-6 lg:px-12'>
          <div className='w-full max-w-lg'>
            {/* Mobile Logo */}
            <div className='mb-6 flex items-center justify-center gap-3 lg:hidden'>
              <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-primary'>
                <Building2 className='h-5 w-5 text-primary-foreground' />
              </div>

              <div>
                <p className='font-semibold'>CSGE</p>
                <p className='text-xs text-muted-foreground'>
                  Management System
                </p>
              </div>
            </div>

            <Card className='overflow-hidden border-border/60 shadow-2xl shadow-black/5'>
              <CardHeader className='border-b bg-background px-6 py-4 sm:px-7'>
                <div className='mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10'>
                  <Users className='h-4 w-4 text-primary' />
                </div>

                <CardTitle className='text-xl font-semibold tracking-tight'>
                  Create account
                </CardTitle>

                <CardDescription className='max-w-md leading-5'>
                  Enter your details below to create your CSGE member account.
                </CardDescription>
              </CardHeader>

              <CardContent className='bg-background px-6 py-5 sm:px-7'>
                <form onSubmit={handleSubmit} className='space-y-4'>
                  {/* Member Information */}
                  <div>
                    <div className='grid gap-3 sm:grid-cols-2'>
                      <div className='space-y-1.5'>
                        <Label htmlFor='memberCode'>Member Code</Label>

                        <Input
                          id='memberCode'
                          value={memberCode}
                          onChange={(event) =>
                            setMemberCode(event.target.value)
                          }
                          placeholder='e.g. M001'
                          autoComplete='username'
                          className='h-10'
                        />
                      </div>

                      <div className='space-y-1.5'>
                        <Label htmlFor='name'>Full Name</Label>

                        <Input
                          id='name'
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          placeholder='Enter your name'
                          autoComplete='name'
                          className='h-10'
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Contact Information */}
                  <div>
                    <div className='grid gap-3 sm:grid-cols-2'>
                      <div className='space-y-1.5'>
                        <Label htmlFor='mobile'>Mobile Number</Label>

                        <Input
                          id='mobile'
                          type='tel'
                          value={mobile}
                          onChange={(event) => setMobile(event.target.value)}
                          placeholder='Enter mobile number'
                          autoComplete='tel'
                          className='h-10'
                        />
                      </div>

                      <div className='space-y-1.5'>
                        <Label htmlFor='email'>
                          Email
                          <span className='ml-1 text-xs font-normal text-muted-foreground'>
                            (optional)
                          </span>
                        </Label>

                        <Input
                          id='email'
                          type='email'
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder='you@example.com'
                          autoComplete='email'
                          className='h-10'
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Password */}
                  <div>
                    <div className='mb-2'>
                      <p className='text-sm font-semibold'>Create password</p>

                      <p className='mt-1 text-xs text-muted-foreground'>
                        Use a strong password to keep your account secure.
                      </p>
                    </div>

                    <div className='grid gap-3 sm:grid-cols-2'>
                      <div className='space-y-1.5'>
                        <Label htmlFor='password'>Password</Label>

                        <Input
                          id='password'
                          type='password'
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          placeholder='Create password'
                          autoComplete='new-password'
                          className='h-10'
                        />
                      </div>

                      <div className='space-y-1.5'>
                        <Label htmlFor='confirmPassword'>
                          Confirm Password
                        </Label>

                        <Input
                          id='confirmPassword'
                          type='password'
                          value={confirmPassword}
                          onChange={(event) =>
                            setConfirmPassword(event.target.value)
                          }
                          placeholder='Confirm password'
                          autoComplete='new-password'
                          className='h-10'
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <div className='pt-0.5'>
                    <Button
                      type='submit'
                      className='h-10 w-full text-sm font-medium'
                    >
                      Create account
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </Button>
                  </div>
                </form>

                {/* Login */}
                <div className='mt-4'>
                  <div className='flex items-center gap-3'>
                    <Separator className='flex-1' />

                    <span className='text-xs text-muted-foreground'>
                      Already have an account?
                    </span>

                    <Separator className='flex-1' />
                  </div>

                  <Button variant='outline' className='mt-3 h-10 w-full'>
                    <Link to='/admin/login'>Sign in to your account</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Register;
