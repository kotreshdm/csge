import { useState } from "react";
import { ArrowRight, Building2, ShieldCheck, Users } from "lucide-react";
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
function Login() {
  const [memberCode, setMemberCode] = useState("");
  const [password, setPassword] = useState("");
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log({ memberCode, password });
  };
  return (
    <main className='min-h-screen bg-muted/40'>
      <div className='grid min-h-screen lg:grid-cols-2'>
        <section className='relative hidden overflow-hidden bg-primary lg:flex'>
          <div className='absolute inset-0'>
            <div className='absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl' />{" "}
            <div className='absolute -bottom-40 -right-20 h-[30rem] w-[30rem] rounded-full bg-white/10 blur-3xl' />{" "}
            <div className='absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl' />{" "}
          </div>
          <div className='relative z-10 flex w-full flex-col justify-between p-12 xl:p-16'>
            <div className='max-w-xl'>
              <p className='mb-4 text-sm font-medium uppercase tracking-[0.2em] text-white/60'>
                Welcome back
              </p>
              <h1 className='text-4xl font-semibold tracking-tight text-white xl:text-5xl'>
                Manage your cooperative operations with confidence.{" "}
              </h1>
              <p className='mt-6 max-w-lg text-base leading-7 text-white/70'>
                A centralized platform to manage members, layouts, developers,
                transactions and day-to-day operations of CSGE.{" "}
              </p>
              <div className='mt-10 grid gap-4 sm:grid-cols-3'>
                <div className='rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm'>
                  <Users className='mb-3 h-5 w-5 text-white' />{" "}
                  <p className='text-sm font-medium text-white'>Members</p>
                  <p className='mt-1 text-xs leading-5 text-white/50'>
                    Centralized member management
                  </p>
                </div>
                <div className='rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm'>
                  <Building2 className='mb-3 h-5 w-5 text-white' />
                  <p className='text-sm font-medium text-white'>Layouts</p>
                  <p className='mt-1 text-xs leading-5 text-white/50'>
                    Manage layouts and developers
                  </p>
                </div>
                <div className='rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm'>
                  <ShieldCheck className='mb-3 h-5 w-5 text-white' />
                  <p className='text-sm font-medium text-white'>Secure</p>
                  <p className='mt-1 text-xs leading-5 text-white/50'>
                    Controlled administrative access
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className='flex items-center justify-center px-4 py-10 sm:px-6 lg:px-12'>
          <div className='w-full max-w-md'>
            <div className='mb-8 flex items-center justify-center gap-3 lg:hidden'>
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
            <Card className='border-border/60 shadow-xl shadow-black/5'>
              <CardHeader className='space-y-2 pb-6'>
                <CardTitle className='text-2xl font-semibold tracking-tight'>
                  Sign in
                </CardTitle>
                <CardDescription>
                  Enter your member credentials to access the administration
                  portal.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className='space-y-5'>
                  <div className='space-y-2'>
                    <Label htmlFor='memberCode'>Member Code</Label>
                    <Input
                      id='memberCode'
                      type='text'
                      value={memberCode}
                      onChange={(event) => setMemberCode(event.target.value)}
                      placeholder='Enter your member code'
                      autoComplete='username'
                    />
                  </div>

                  <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <Label htmlFor='password'>Password</Label>
                      <button
                        type='button'
                        className='text-xs font-medium text-primary hover:underline'
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Input
                      id='password'
                      type='password'
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder='Enter your password'
                      autoComplete='current-password'
                    />
                  </div>
                  <Button
                    type='submit'
                    className='h-14 w-full rounded-lg text-base font-semibold shadow-md transition-all hover:shadow-lg'
                  >
                    Sign in
                    <ArrowRight className='ml-2 h-5 w-5' />
                  </Button>
                </form>
                <div className='my-6 flex items-center gap-3'>
                  <Separator className='flex-1' />
                  <span className='text-xs text-muted-foreground'>
                    New member?
                  </span>
                  <Separator className='flex-1' />
                </div>

                <Button variant='outline' className='w-full'>
                  <Link to='/admin/register'>Create an account</Link>
                </Button>
                <p className='mt-6 text-center text-xs leading-5 text-muted-foreground'>
                  By continuing, you agree to use this system only for
                  authorized CSGE activities.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
export default Login;
