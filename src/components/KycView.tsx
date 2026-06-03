"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitKycSubmission } from '@/app/actions/client';

export default function KycView({ userId }: { userId: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [personal, setPersonal] = useState({ 
    fn: '', ln: '', em: '', mt5: '', dob: '', nationality: 'Kenya', docType: 'ID_CARD' 
  });
  const [err, setErr] = useState('');
  const [files, setFiles] = useState<Record<string, File | null>>({
    'ID Front': null,
    'ID Back': null,
    'Selfie with ID': null,
    'Proof of Address': null,
  });

  const renderStepIcon = (i: number) => {
    if (i < step) return <div className="step-circle done">✓</div>;
    if (i === step) return <div className="step-circle active">{i}</div>;
    return <div className="step-circle">{i}</div>;
  };

  const renderStepItem = (i: number, label: string) => (
    <div className={`step-item ${i < step ? 'done' : i === step ? 'active' : ''}`}>
      {renderStepIcon(i)}
      <span className="step-label">{label}</span>
    </div>
  );

  const renderStepLine = (i: number) => (
    <div className={`step-line ${i < step ? 'done' : ''}`}></div>
  );

  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});

  const handleFileChange = (label: string, file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setErr(`Document "${label}" has an invalid file type. Only JPEG, PNG, and PDF are allowed.`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErr(`Document "${label}" exceeds the 5MB limit. Please upload a compressed version.`);
      return;
    }
    setFiles(prev => ({ ...prev, [label]: file }));
    setUploadedDocs(prev => ({ ...prev, [label]: true }));
    setErr('');
  };

  const renderUploadZone = (label: string, icon: React.ReactNode, sub: string) => {
    const isUploaded = !!uploadedDocs[label];
    const fileInputId = `file-input-${label.replace(/\s+/g, '-')}`;
    
    return (
      <div 
        className="upload-zone" 
        onClick={() => document.getElementById(fileInputId)?.click()}
        style={isUploaded ? { borderColor: 'var(--green)', background: 'var(--green-bg)' } : undefined}
      >
        <input 
          id={fileInputId}
          type="file" 
          hidden 
          accept="image/*,application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileChange(label, file);
          }}
        />
        {isUploaded ? (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 24, height: 24, color: 'var(--green)', display: 'block', margin: '0 auto 10px' }}><polyline points="20 6 9 17 4 12"/></svg>
            <div className="uz-title" style={{ color: 'var(--green)', fontWeight: 600 }}>{label} Encrypted</div>
            <div className="uz-sub">Touch to redistribute</div>
          </>
        ) : (
          <>
            <div style={{ color: 'var(--brand)', marginBottom: 12 }}>{icon}</div>
            <div className="uz-title">{label}</div>
            <div className="uz-sub">{sub}</div>
          </>
        )}
      </div>
    );
  };

  const handleStep1 = () => {
    if (!personal.fn || !personal.ln || !personal.em) {
      setErr('All personal identity fields are mandatory.');
      return;
    }
    setErr('');
    setStep(2);
  };

  const handleStep2 = () => {
    if (!uploadedDocs['ID Front'] || !uploadedDocs['ID Back'] || !uploadedDocs['Selfie with ID'] || !uploadedDocs['Proof of Address']) {
      setErr('Incomplete compliance documents. 4/4 required.');
      return;
    }
    setErr('');
    setStep(3);
  };

  const handleStep3 = () => {
    if (!personal.mt5) {
      setErr('MT5 Account ID is required to link your account.');
      return;
    }
    setErr('');
    setStep(4);
  };

  return (
    <div id="view-kyc">
      <div className="kyc-topbar">
        <div className="logo-mark">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="8" rx="2" stroke="none" fill="rgba(255,255,255,0.2)"/>
              <path d="M12 2v20M17 5H7M17 19H7M2 12h20" opacity="0.5"/>
              <circle cx="12" cy="12" r="3" fill="#fff"/>
            </svg>
          </div>
          <div className="logo-text" style={{ fontSize: 18 }}>Nexus<span>FX</span></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="badge b-gold" style={{ fontSize: 11, fontWeight: 700 }}>ACCOUNT VERIFICATION</span>
          <button className="btn btn-ghost btn-sm" onClick={() => router.push('/')}>Exit</button>
        </div>
      </div>

      <div className="kyc-wrap">
        <div className="steps-row">
          {renderStepItem(1, 'Profile')} {renderStepLine(1)}
          {renderStepItem(2, 'Documents')} {renderStepLine(2)}
          {renderStepItem(3, 'Link Account')} {renderStepLine(3)}
          {renderStepItem(4, 'Review')}
        </div>
        
        {err && <div className="alert alert-err" style={{ marginBottom: 24 }}>{err}</div>}

        {step === 1 && (
          <div className="kyc-card panel active fade">
            <div className="kyc-title">Personal Details</div>
            <div className="kyc-sub">Please enter your details exactly as they appear on your government-issued ID.</div>
            <div className="frow">
              <div className="fgroup"><label>First Name</label><input type="text" placeholder="John" value={personal.fn} onChange={e => setPersonal({...personal, fn: e.target.value})} /></div>
              <div className="fgroup"><label>Last Name</label><input type="text" placeholder="Doe" value={personal.ln} onChange={e => setPersonal({...personal, ln: e.target.value})} /></div>
            </div>
            <div className="fgroup"><label>Email Address</label><input type="email" placeholder="john@email.com" value={personal.em} onChange={e => setPersonal({...personal, em: e.target.value})} /></div>
            <div className="frow">
              <div className="fgroup"><label>Phone Number</label><input type="tel" placeholder="+254 7xx xxx xxx" /></div>
              <div className="fgroup"><label>Date of Birth</label><input type="date" value={personal.dob} onChange={e => setPersonal({...personal, dob: e.target.value})} /></div>
            </div>
            <div className="frow">
              <div className="fgroup"><label>Country</label>
                <select value={personal.nationality} onChange={e => setPersonal({...personal, nationality: e.target.value})}>
                  <option value="Kenya">Kenya (KE)</option><option value="Nigeria">Nigeria (NG)</option><option value="South Africa">South Africa (ZA)</option><option value="UAE">United Arab Emirates (AE)</option><option value="United Kingdom">United Kingdom (GB)</option>
                </select>
              </div>
              <div className="fgroup"><label>Source of Funds</label>
                <select defaultValue="Employment Income">
                  <option>Employment Income</option><option>Business Operations</option><option>Savings</option>
                </select>
              </div>
            </div>
            <div className="fgroup" style={{ marginBottom: 24 }}>
              <label>Residential Address</label>
              <input type="text" placeholder="Street Address, City, ZIP Code" />
            </div>
            <button className="btn btn-gold" onClick={handleStep1}>Next: Upload Documents →</button>
          </div>
        )}

        {step === 2 && (
          <div className="kyc-card panel active fade">
            <div className="kyc-title">Upload ID Documents</div>
            <div className="kyc-sub">Please upload clear photos of your ID documents. We encrypt and store all files securely.</div>
            
            <div className="alert alert-info" style={{ marginBottom: 24 }}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style={{ marginRight: 8 }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
              Verification is required to unlock live trading signals and dashboard features.
            </div>

            <div className="fgroup">
              <label>Document Type</label>
              <select value={personal.docType} onChange={e => setPersonal({...personal, docType: e.target.value})}>
                <option value="ID_CARD">National Identity Card</option>
                <option value="PASSPORT">Passport</option>
                <option value="ID_CARD">Driver's License</option>
              </select>
            </div>
            <div className="frow">
              {renderUploadZone('ID Front', <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="13" rx="2"/><path d="M3 14l4-4 3 3 4-4 5 5"/><circle cx="8" cy="8" r="1.5"/></svg>, 'Front page / aspect')}
              {renderUploadZone('ID Back', <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="13" rx="2"/><path d="M3 14l4-4 3 3 4-4 5 5"/><circle cx="8" cy="8" r="1.5"/></svg>, 'Back page / aspect')}
            </div>
            <div className="frow">
              {renderUploadZone('Selfie with ID', <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>, 'Selfie holding your ID')}
              {renderUploadZone('Proof of Address', <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, 'Utility Bill or Bank Statement')}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button className="btn btn-ghost" style={{ flex: '0 0 120px' }} onClick={() => { setErr(''); setStep(1); }}>Back</button>
              <button className="btn btn-gold" style={{ flex: 1 }} onClick={handleStep2}>Next: Link Account →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="kyc-card panel active fade">
            <div className="kyc-title">Link Your Trading Account</div>
            <div className="kyc-sub">Connect your MetaTrader 5 (MT5) account to view details inside your dashboard.</div>
            
            <div className="alert alert-warn" style={{ marginBottom: 24 }}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style={{ marginRight: 8 }}><path d="M12 2L2 22h20L12 2zm0 4l8 14H4L12 6zm-1 5v4h2v-4zm0 6v2h2v-2z"/></svg>
              Important: Use your <strong>Investor (Read-Only) Password</strong>. We will never ask for withdrawal permissions.
            </div>

            <div className="mt5-connect-box" style={{ background: 'var(--bg2)', padding: 20, marginBottom: 24 }}>
              <div className="mt5-logo" style={{ width: 44, height: 44, fontSize: 13 }}>MT5</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)' }}>Trading Account Linker</div>
                <div style={{ fontSize: 12, color: 'var(--t4)', marginTop: 2 }}>Secure connection ready</div>
              </div>
              <span className="badge b-ok" style={{ marginLeft: 'auto' }}>READY</span>
            </div>

            <div className="fgroup"><label>MT5 Login ID</label><input type="text" placeholder="12345678" style={{ fontFamily: 'var(--ff-m)', letterSpacing: 1 }} value={personal.mt5} onChange={e => setPersonal({...personal, mt5: e.target.value.replace(/\D/g, '')})} /></div>
            
            <div className="frow">
              <div className="fgroup"><label>Connection Type</label>
                <select><option>Investor Access (Read-Only)</option><option>Full Account Access</option></select>
              </div>
              <div className="fgroup"><label>Password</label><input type="password" placeholder="••••••••" /></div>
            </div>
            <div className="fgroup"><label>Broker Server</label>
              <select defaultValue="">
                <option value="">Select your broker server...</option>
                <option>Exness-MT5-Server</option><option>ICMarkets-MT5-Server</option><option>GlobalPrime-MT5-Server</option>
              </select>
            </div>
            <div className="frow" style={{ marginBottom: 24 }}>
              <div className="fgroup"><label>Starting Balance (USD)</label><input type="number" placeholder="Min $500" /></div>
              <div className="fgroup"><label>Risk Level</label>
                <select defaultValue="Moderate">
                  <option>Low Risk</option><option>Medium Risk</option><option>High Risk</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-ghost" style={{ flex: '0 0 120px' }} onClick={() => { setErr(''); setStep(2); }}>Back</button>
              <button className="btn btn-gold" style={{ flex: 1 }} onClick={handleStep3}>Next: Review Details →</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="kyc-card panel active fade">
            <div className="kyc-title">Review Details</div>
            <div className="kyc-sub">Please check the information below before submitting.</div>
            
            <div className="chart-box" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', marginBottom: 12, opacity: 0.7 }}>PERSONAL DETAILS</div>
              <div className="review-line"><span className="review-key">Full Name</span><span className="review-val" style={{ fontWeight: 600 }}>{personal.fn} {personal.ln}</span></div>
              <div className="review-line"><span className="review-key">ID Type</span><span className="review-val">{personal.docType}</span></div>
            </div>

            <div className="chart-box" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', marginBottom: 12, opacity: 0.7 }}>TRADING ACCOUNT</div>
              <div className="review-line"><span className="review-key">MT5 Login ID</span><span className="review-val" style={{ fontFamily: 'var(--ff-m)' }}>{personal.mt5}</span></div>
              <div className="review-line"><span className="review-key">Access Level</span><span className="review-val">Investor (Read-Only)</span></div>
              <div className="review-line"><span className="review-key">Link Strategy</span><span className="review-val">Gold (XAU/USD) signals</span></div>
            </div>

            <div className="alert alert-info" style={{ marginBottom: 24 }}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style={{ marginRight: 8, flexShrink: 0 }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
              <span>By submitting, you confirm that these details are correct and complete.</span>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-ghost" style={{ flex: '0 0 120px' }} onClick={() => { setErr(''); setStep(3); }} disabled={isSubmitting}>Modify</button>
              <button className="btn btn-gold" style={{ flex: 1 }} onClick={async () => {
                setIsSubmitting(true);
                setErr('');
                const formData = new FormData();
                formData.append('fullName', `${personal.fn} ${personal.ln}`);
                formData.append('dob', personal.dob);
                formData.append('nationality', personal.nationality);
                formData.append('documentType', personal.docType);
                if (files['ID Front']) formData.append('idFront', files['ID Front']);
                if (files['ID Back']) formData.append('idBack', files['ID Back']);
                if (files['Selfie with ID']) formData.append('selfie', files['Selfie with ID']);
                if (files['Proof of Address']) formData.append('proofAddress', files['Proof of Address']);

                const res = await submitKycSubmission(formData, userId);
                setIsSubmitting(false);
                if (res.success) setStep(5);
                else setErr(res.error || 'Connection error during document upload.');
              }} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Details ✓"}
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="kyc-card panel active fade">
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 72, height: 72, background: 'var(--green-bg)', border: '2px solid var(--green)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 32, color: 'var(--green)' }}>✓</div>
              <div className="kyc-title" style={{ fontSize: 28, marginBottom: 12 }}>Submission Successful!</div>
              <div style={{ color: 'var(--t3)', fontSize: 15, marginBottom: 32, fontWeight: 300, lineHeight: 1.6 }}>Your documents have been submitted for review. We usually approve accounts within 24 hours.</div>
              
              <div className="chart-box" style={{ textAlign: 'left', marginBottom: 32 }}>
                <div className="review-line"><span className="review-key">Verification Reference</span><span style={{ fontFamily: 'var(--ff-m)', color: 'var(--brand)', fontWeight: 600 }}>NEX-VERIFY-2026</span></div>
                <div className="review-line"><span className="review-key">Review Status</span><span className="badge b-warn">REVIEWING</span></div>
              </div>

              <button className="btn btn-gold" style={{ padding: '16px 40px', width: 'auto' }} onClick={() => router.push('/client')}>Go to Dashboard →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
