export const FIELD_META = {
  // Personal
  fullName:          { label: 'Full Name (as per NID/Passport)', type: 'text',   section: 'Personal Information',  icon: '👤' },
  fatherMotherName:  { label: "Father's / Mother's Name",       type: 'text',   section: 'Personal Information',  icon: '👤' },
  spouseName:        { label: 'Spouse Name',                     type: 'text',   section: 'Personal Information',  icon: '👤' },
  dob:               { label: 'Date of Birth',                  type: 'date',   section: 'Personal Information',  icon: '👤' },
  nidPassportNumber: { label: 'NID / Passport Number',          type: 'text',   section: 'Personal Information',  icon: '👤' },
  profession:        { label: 'Profession / Company',           type: 'text',   section: 'Personal Information',  icon: '👤' },
  nationality:       { label: 'Nationality',                    type: 'text',   section: 'Personal Information',  icon: '👤' },
  // Contact
  mobile:            { label: 'Mobile Number',                  type: 'tel',    section: 'Contact Information',   icon: '📞' },
  email:             { label: 'Email Address',                  type: 'email',  section: 'Contact Information',   icon: '📞' },
  presentAddress:    { label: 'Present Address',                type: 'textarea', section: 'Contact Information', icon: '📞' },
  permanentAddress:  { label: 'Permanent Address',              type: 'textarea', section: 'Contact Information', icon: '📞' },
  // Financial
  tinCertificate:    { label: 'TIN Certificate Number',         type: 'text',   section: 'Financial Information', icon: '💳' },
  paymentSource:     { label: 'Payment Source',                 type: 'text',   section: 'Financial Information', icon: '💳' },
  bankDetails:       { label: 'Bank Details',                   type: 'textarea', section: 'Financial Information', icon: '💳' },
  // Property
  projectNameLocation:{ label: 'Project Name / Location',       type: 'text',   section: 'Property Details',     icon: '🏠' },
  sizeFloor:          { label: 'Size / Floor',                   type: 'text',   section: 'Property Details',     icon: '🏠' },
  unitNumber:         { label: 'Unit Number',                    type: 'text',   section: 'Property Details',     icon: '🏠' },
  carParking:         { label: 'Car Parking Preference',         type: 'text',   section: 'Property Details',     icon: '🏠' },
  installmentPreference: { label: 'Installment Preference',     type: 'select', section: 'Property Details',     icon: '🏠', options: ['Monthly', 'Quarterly', 'Half-yearly', 'Yearly', 'Lump Sum'] },
  // Nominee
  nomineeName:       { label: 'Nominee Name',                   type: 'text',   section: 'Nominee Information',  icon: '👥' },
  nomineeRelation:   { label: 'Relation with Nominee',          type: 'text',   section: 'Nominee Information',  icon: '👥' },
  nomineeNid:        { label: 'Nominee NID Number',             type: 'text',   section: 'Nominee Information',  icon: '👥' },
  // Documents
  customerPhoto:     { label: 'Customer Photo',                 type: 'file',   section: 'Required Documents',   icon: '📄' },
  nidCopy:           { label: 'NID Copy',                       type: 'file',   section: 'Required Documents',   icon: '📄' },
  tinCopy:           { label: 'TIN Certificate Copy',           type: 'file',   section: 'Required Documents',   icon: '📄' },
  nomineePhoto:      { label: 'Nominee Photo',                  type: 'file',   section: 'Required Documents',   icon: '📄' },
  nomineeNidCopy:    { label: 'Nominee NID Copy',               type: 'file',   section: 'Required Documents',   icon: '📄' },
};

export const SECTION_ORDER = [
  'Personal Information',
  'Contact Information',
  'Financial Information',
  'Property Details',
  'Nominee Information',
  'Required Documents',
];

export const SECTION_ICONS = {
  'Personal Information':  '👤',
  'Contact Information':   '📞',
  'Financial Information': '💳',
  'Property Details':      '🏠',
  'Nominee Information':   '👥',
  'Required Documents':    '📄',
};
