
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithAzure } = useAuth();

  const handleAzureSignIn = async () => {
    setIsLoading(true);
    await signInWithAzure();
    // Note: Loading state will persist until redirect happens
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-blue-600">ProjectAI</h2>
          <p className="mt-2 text-gray-600">Modern Project Management</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Sign in with your Azure account to access ProjectAI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleAzureSignIn} 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in with Azure
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
