import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  Calendar,
  MoreHorizontal,
  Edit,
  Shield,
  UserCheck,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string;
  position: string;
  avatar_url: string;
  workload?: number;
  status?: string;
  created_at: string;
}

export function TeamPage() {
  const { userRole, user } = useAuth();
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map the data to include default values and ensure ahmualotaibi@flynas.com is always admin
      const mappedMembers = (data || []).map((member: any) => ({
        ...member,
        role: member.email === 'ahmualotaibi@flynas.com' ? 'admin' : member.role,
        workload: (member as any).workload || Math.floor(Math.random() * 100), // Random workload for demo
        status: (member as any).status || 'active'
      }));
      
      setTeamMembers(mappedMembers);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast({
        title: "Error",
        description: "Failed to fetch team members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
    const member = teamMembers.find(m => m.id === memberId);
    
    // Prevent changing admin role for ahmualotaibi@flynas.com
    if (member?.email === 'ahmualotaibi@flynas.com' && newRole !== 'admin') {
      toast({
        title: "Permission Denied",
        description: "This user's admin role cannot be changed",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Member role updated successfully",
      });
      
      fetchTeamMembers();
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        title: "Error",
        description: "Failed to update member role",
        variant: "destructive",
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'manager': return 'default';
      case 'member': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Shield;
      case 'manager': return UserCheck;
      case 'member': return Users;
      default: return Users;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'busy': return 'bg-yellow-500';
      case 'away': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getWorkloadColor = (workload: number) => {
    if (workload >= 80) return 'bg-red-500';
    if (workload >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Team</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardHeader>
              <CardContent>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-1">
            Manage your team members, roles, and workload distribution
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            Invite Members
          </Button>
          {userRole === 'admin' && (
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 bg-white min-w-[120px]"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="member">Member</option>
        </select>
      </div>

      {/* Enhanced Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold">{teamMembers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold">{teamMembers.filter(m => m.role === 'admin').length}</p>
              </div>
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Managers</p>
                <p className="text-2xl font-bold">{teamMembers.filter(m => m.role === 'manager').length}</p>
              </div>
              <UserCheck className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold">{teamMembers.filter(m => (m.status || 'active') === 'active').length}</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Workload</p>
                <p className="text-2xl font-bold">{Math.round(teamMembers.reduce((acc, m) => acc + (m.workload || 0), 0) / teamMembers.length) || 0}%</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => {
          const RoleIcon = getRoleIcon(member.role);
          return (
            <Card key={member.id} className="hover:shadow-lg transition-all duration-200 border-l-4" style={{borderLeftColor: member.role === 'admin' ? '#dc2626' : member.role === 'manager' ? '#6b7280' : '#3b82f6'}}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                        {member.full_name?.charAt(0) || member.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <span>{member.full_name || 'User'}</span>
                        {member.email === 'ahmualotaibi@flynas.com' && (
                          <Shield className="h-4 w-4 text-red-600" aria-label="Super Admin" />
                        )}
                      </CardTitle>
                      <CardDescription>{member.email}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(member.status || 'active')}`} title={member.status || 'active'} />
                    {userRole === 'admin' && (
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Badge variant={getRoleColor(member.role)} className="text-xs flex items-center space-x-1">
                      <RoleIcon className="h-3 w-3" />
                      <span>{member.role}</span>
                    </Badge>
                    {member.email === 'ahmualotaibi@flynas.com' && (
                      <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                        Super Admin
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">{member.department || 'General'}</span>
                </div>
                
                {member.position && (
                  <p className="text-sm text-gray-600">{member.position}</p>
                )}

                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Workload</span>
                    <span className={`font-medium ${(member.workload || 0) >= 80 ? 'text-red-600' : (member.workload || 0) >= 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {member.workload || 0}%
                    </span>
                  </div>
                  <Progress 
                    value={member.workload || 0} 
                    className="h-2"
                    style={{
                      background: `linear-gradient(to right, ${getWorkloadColor(member.workload || 0)} ${member.workload || 0}%, #e5e7eb ${member.workload || 0}%)`
                    }}
                  />
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-xs text-gray-500">
                    Joined {new Date(member.created_at).toLocaleDateString()}
                  </span>
                  {userRole === 'admin' && (
                    <div className="flex space-x-1">
                      {member.email !== 'ahmualotaibi@flynas.com' && (
                        <select
                          value={member.role}
                          onChange={(e) => updateMemberRole(member.id, e.target.value)}
                          className="text-xs border rounded px-2 py-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="member">Member</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
          <p className="text-gray-500">
            {searchTerm || selectedRole !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Start by inviting team members to your workspace'
            }
          </p>
        </div>
      )}
    </div>
  );
}
