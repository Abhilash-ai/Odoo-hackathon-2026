import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/auth.context';
import { useToast } from '../context/toast.context';
import { api } from '../services/api';
import {
  User,
  Phone,
  MapPin,
  Heart,
  FileText,
  Upload,
  Trash2,
  Lock,
  Mail,
  Shield,
  Briefcase,
} from 'lucide-react';

export const Profile = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Admin-only fields state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [status, setStatus] = useState('ACTIVE');

  // Document upload state
  const [docName, setDocName] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [submittingDoc, setSubmittingDoc] = useState(false);
  const [submittingProfile, setSubmittingProfile] = useState(false);

  const loadProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.employees.get(user.id);
      setProfile(data);

      // Populate forms
      setPhone(data.phone || '');
      setAddress(data.address || '');
      setProfilePhoto(data.profilePhoto || '');
      setEmergencyContactName(data.emergencyContactName || '');
      setEmergencyContactRelation(data.emergencyContactRelation || '');
      setEmergencyContactPhone(data.emergencyContactPhone || '');

      // Populate Admin forms
      setFullName(data.fullName || '');
      setEmail(data.email || '');
      setEmployeeId(data.employeeId || '');
      setRole(data.role || 'EMPLOYEE');
      setStatus(data.status || 'ACTIVE');
    } catch (err: any) {
      toast.error('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProfile(true);
    try {
      const body: any = {
        phone: phone.trim() || null,
        address: address.trim() || null,
        profilePhoto: profilePhoto.trim() || null,
        emergencyContactName: emergencyContactName.trim() || null,
        emergencyContactRelation: emergencyContactRelation.trim() || null,
        emergencyContactPhone: emergencyContactPhone.trim() || null,
      };

      if (user?.role === 'ADMIN') {
        body.fullName = fullName.trim();
        body.email = email.trim();
        body.employeeId = employeeId.trim();
        body.role = role;
        body.status = status;
      }

      await api.employees.update(profile.id, body);
      toast.success('Profile details updated successfully!');
      await refreshUser();
      loadProfile();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setSubmittingProfile(false);
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName || !docUrl) {
      toast.error('Please enter a document name and link.');
      return;
    }

    setSubmittingDoc(true);
    try {
      await api.employees.uploadDocument({
        userId: profile.id,
        name: docName.trim(),
        url: docUrl.trim(),
      });
      toast.success('Document uploaded successfully!');
      setDocName('');
      setDocUrl('');
      loadProfile();
    } catch (err: any) {
      toast.error('Failed to add document.');
    } finally {
      setSubmittingDoc(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.employees.deleteDocument(docId);
      toast.success('Document deleted successfully!');
      loadProfile();
    } catch (err: any) {
      toast.error('Failed to delete document.');
    }
  };

  if (loading || !profile) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-card border rounded-2xl" />
          <div className="h-96 bg-card border rounded-2xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Profile</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Update contact details, configure emergency contacts, and upload credential papers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & General Cards */}
        <div className="space-y-6">
          {/* Avatar Panel */}
          <div className="bg-card border rounded-2xl p-6 shadow-sm text-center relative overflow-hidden flex flex-col items-center">
            {/* Cover light accent */}
            <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-r from-primary/10 to-violet-500/10 border-b" />

            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl border border-background shadow-lg overflow-hidden relative z-10 mt-10 shrink-0">
              {profile.profilePhoto ? (
                <img src={profile.profilePhoto} alt={profile.fullName} className="w-full h-full object-cover" />
              ) : (
                profile.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()
              )}
            </div>

            <h3 className="font-extrabold text-base mt-4">{profile.fullName}</h3>
            <p className="text-xs text-muted-foreground mt-1 font-semibold uppercase py-0.5 px-2 bg-secondary border rounded-full">
              {profile.role}
            </p>

            <div className="w-full text-xs text-muted-foreground flex flex-col gap-2 mt-6 border-t pt-4 text-left">
              <div className="flex justify-between">
                <span>Employee ID:</span>
                <strong className="font-bold text-foreground">{profile.employeeId}</strong>
              </div>
              <div className="flex justify-between">
                <span>Email Address:</span>
                <strong className="font-bold text-foreground">{profile.email}</strong>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <strong className={`font-bold uppercase ${profile.status === 'ACTIVE' ? 'text-emerald-500' : 'text-rose-500'}`}>{profile.status}</strong>
              </div>
              <div className="flex justify-between">
                <span>Joined Date:</span>
                <strong className="font-bold text-foreground">{new Date(profile.createdAt).toLocaleDateString()}</strong>
              </div>
            </div>
          </div>

          {/* Documents Panel */}
          <div className="bg-card border rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              My Documents
            </h3>
            
            <div className="flex flex-col gap-3.5 mb-6">
              {profile.documents?.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 text-center">No documents uploaded</p>
              ) : (
                profile.documents?.map((doc: any) => (
                  <div key={doc.id} className="flex justify-between items-center p-3 bg-secondary/25 border rounded-xl">
                    <div className="min-w-0 flex-1 mr-2">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-xs text-primary hover:underline truncate block"
                      >
                        {doc.name}
                      </a>
                      <span className="text-[10px] text-muted-foreground">
                        Added: {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg shrink-0 transition-colors cursor-pointer"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Document Upload Input */}
            <form onSubmit={handleUploadDoc} className="border-t pt-4 flex flex-col gap-3">
              <p className="text-xs font-bold text-foreground">Attach Credential Paper</p>
              <input
                type="text"
                placeholder="Document Title (e.g. ID Card)"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all text-xs"
              />
              <div className="relative">
                <input
                  type="text"
                  placeholder="Document URL (Mock Link)"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all text-xs"
                />
              </div>
              <button
                type="submit"
                disabled={submittingDoc}
                className="w-full bg-secondary hover:bg-secondary/80 border text-foreground font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Doc
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Editable Profile Forms */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <h3 className="font-bold text-base flex items-center gap-2 border-b pb-3">
              <User className="w-5 h-5 text-primary" />
              Information Details
            </h3>

            {/* Admin-only advanced fields */}
            {user?.role === 'ADMIN' && (
              <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl space-y-4">
                <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Administrative Configuration Settings (HR Only)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="px-3 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs font-semibold"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employee ID</label>
                    <input
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className="px-3 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs font-semibold"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="px-3 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="px-3 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs font-semibold"
                      >
                        <option value="EMPLOYEE">Employee</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="px-3 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs font-semibold"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="SUSPENDED">Suspended</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Standard Profile Fields */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contact details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 555 000 000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs font-medium"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    Resident Address
                  </label>
                  <input
                    type="text"
                    placeholder="123 Silicon Valley Road, CA"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs font-medium"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                  Profile Photo URL (Avatar Link)
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={profilePhoto}
                  onChange={(e) => setProfilePhoto(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs font-medium"
                />
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500" />
                Emergency contact details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</label>
                  <input
                    type="text"
                    placeholder="Mary Doe"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs font-medium"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Relationship</label>
                  <input
                    type="text"
                    placeholder="Spouse, Father..."
                    value={emergencyContactRelation}
                    onChange={(e) => setEmergencyContactRelation(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs font-medium"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1 555 999 999"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary focus:outline-none text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={submittingProfile}
                className="bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-xl shadow-md hover:bg-primary/95 transition-all text-sm cursor-pointer disabled:opacity-50"
              >
                {submittingProfile ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  'Save Profile Details'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
