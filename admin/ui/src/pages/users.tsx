import { useEffect, useState } from "react";
import { api } from "@/api/index.js";
import type { User, CreateUserPayload } from "@/types.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Shield, User as UserIcon, RefreshCw } from "lucide-react";

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<string>("admin");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Paginated states
  const [adminPage, setAdminPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  
  const [adminData, setAdminData] = useState<{ users: User[]; total: number; totalPages: number }>({
    users: [], total: 0, totalPages: 1
  });
  const [userData, setUserData] = useState<{ users: User[]; total: number; totalPages: number }>({
    users: [], total: 0, totalPages: 1
  });

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserPayload>({
    name: "", email: "", password: "", role: "user",
  });
  const [creating, setCreating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string; name?: string } | null>(null);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function loadTab(role: "admin" | "user", page: number) {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listUsers({ role, page, limit: 10 });
      if (role === "admin") {
        setAdminData({ users: data.users, total: data.total, totalPages: data.totalPages });
      } else {
        setUserData({ users: data.users, total: data.total, totalPages: data.totalPages });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTab(activeTab as "admin" | "user", activeTab === "admin" ? adminPage : userPage);
  }, [activeTab, adminPage, userPage]);

  function refreshCurrent() {
    loadTab(activeTab as "admin" | "user", activeTab === "admin" ? adminPage : userPage);
  }

  function validateForm(): boolean {
    const errors: { email?: string; password?: string; name?: string } = {};

    if (!createForm.email.trim()) {
      errors.email = "Email is required";
    } else if (createForm.email.length > 254) {
      errors.email = "Email must be 254 characters or less";
    } else if (!EMAIL_REGEX.test(createForm.email)) {
      errors.email = "Invalid email format";
    }

    if (!createForm.password) {
      errors.password = "Password is required";
    } else if (createForm.password.length < 6 || createForm.password.length > 72) {
      errors.password = "Password must be between 6 and 72 characters";
    }

    if (createForm.name && createForm.name.length > 100) {
      errors.name = "Name must be 100 characters or less";
    }

    setValidationErrors(Object.keys(errors).length > 0 ? errors : null);
    return Object.keys(errors).length === 0;
  }

  async function handleCreate() {
    if (!validateForm()) return;
    setCreating(true);
    setError(null);
    try {
      await api.createUser(createForm);
      setShowCreate(false);
      setCreateForm({ name: "", email: "", password: "", role: "user" });
      setValidationErrors(null);
      
      // Load first page of the role we just created
      if (createForm.role === "admin") {
        setAdminPage(1);
        if (activeTab === "admin") {
          loadTab("admin", 1);
        } else {
          setActiveTab("admin");
        }
      } else {
        setUserPage(1);
        if (activeTab === "user") {
          loadTab("user", 1);
        } else {
          setActiveTab("user");
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      await api.deleteUser(deleteTarget._id);
      setDeleteTarget(null);
      refreshCurrent();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleRoleChange(user: User, newRole: "admin" | "user") {
    setError(null);
    try {
      await api.updateUser(user._id, { role: newRole });
      refreshCurrent();
    } catch (err: any) {
      setError(err.message);
    }
  }

  const renderPagination = (currentPage: number, totalPages: number, setPage: (p: number) => void) => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-muted-foreground">
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  const renderTable = (usersList: User[]) => {
    if (usersList.length === 0) {
      return (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No users found in this section.</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usersList.map((user) => (
            <TableRow key={user._id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {user.role === "admin" ? (
                    <Shield className="h-4 w-4 text-foreground" />
                  ) : (
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                  {user.name || "—"}
                </div>
              </TableCell>
              <TableCell className="font-mono text-xs">{user.email}</TableCell>
              <TableCell>
                <Select
                  value={user.role}
                  onValueChange={(value) => handleRoleChange(user, value as "admin" | "user")}
                >
                  <SelectTrigger className="w-24 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteTarget(user)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage admin and user accounts. Users are stored in MongoDB.
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={refreshCurrent} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Add Account
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Separator />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="admin">Administrators ({adminData.total})</TabsTrigger>
          <TabsTrigger value="user">Regular Users ({userData.total})</TabsTrigger>
        </TabsList>

        <TabsContent value="admin">
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading administrators...</p>
          ) : (
            <>
              {renderTable(adminData.users)}
              {renderPagination(adminPage, adminData.totalPages, setAdminPage)}
            </>
          )}
        </TabsContent>

        <TabsContent value="user">
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading users...</p>
          ) : (
            <>
              {renderTable(userData.users)}
              {renderPagination(userPage, userData.totalPages, setUserPage)}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent onClose={() => setShowCreate(false)}>
          <DialogHeader>
            <DialogTitle>Create Account</DialogTitle>
            <DialogDescription>Add a new user or admin account to the platform.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="new-name">Name</Label>
              <Input
                id="new-name"
                value={createForm.name}
                onChange={(e) => {
                  setCreateForm({ ...createForm, name: e.target.value });
                  if (validationErrors?.name) setValidationErrors({ ...validationErrors, name: undefined });
                }}
                placeholder="John Doe"
                className={validationErrors?.name ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {validationErrors?.name && (
                <p className="text-xs text-destructive mt-1">{validationErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">Email</Label>
              <Input
                id="new-email"
                type="email"
                value={createForm.email}
                onChange={(e) => {
                  setCreateForm({ ...createForm, email: e.target.value });
                  if (validationErrors?.email) setValidationErrors({ ...validationErrors, email: undefined });
                }}
                placeholder="john@example.com"
                className={validationErrors?.email ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {validationErrors?.email && (
                <p className="text-xs text-destructive mt-1">{validationErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Password</Label>
              <Input
                id="new-password"
                type="password"
                value={createForm.password}
                onChange={(e) => {
                  setCreateForm({ ...createForm, password: e.target.value });
                  if (validationErrors?.password) setValidationErrors({ ...validationErrors, password: undefined });
                }}
                placeholder="Minimum 6 characters"
                className={validationErrors?.password ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {validationErrors?.password && (
                <p className="text-xs text-destructive mt-1">{validationErrors.password}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-role">Role</Label>
              <Select
                value={createForm.role}
                onValueChange={(value) => setCreateForm({ ...createForm, role: value as "admin" | "user" })}
              >
                <SelectTrigger id="new-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !createForm.email || !createForm.password}>
              {creating ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent onClose={() => setDeleteTarget(null)}>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name || deleteTarget?.email}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
