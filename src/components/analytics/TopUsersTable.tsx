import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users } from 'lucide-react';

interface UserUsage {
  email: string;
  fullName: string | null;
  sessions: number;
  minutes: number;
  cost: number;
}

interface TopUsersTableProps {
  users: UserUsage[];
  overageRate: number;
}

export const TopUsersTable = ({ users, overageRate }: TopUsersTableProps) => {
  // Sort by minutes (descending)
  const sortedUsers = [...users].sort((a, b) => b.minutes - a.minutes);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          User Breakdown
        </CardTitle>
        <CardDescription>Top users by usage this month</CardDescription>
      </CardHeader>
      <CardContent>
        {sortedUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No practice sessions recorded this month
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Sessions</TableHead>
                <TableHead className="text-right">Minutes</TableHead>
                <TableHead className="text-right">Estimated Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.map((user, index) => (
                <TableRow key={user.email}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {user.fullName || user.email.split('@')[0]}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{user.sessions}</TableCell>
                  <TableCell className="text-right">{user.minutes.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium">
                    ${(user.minutes * overageRate).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
