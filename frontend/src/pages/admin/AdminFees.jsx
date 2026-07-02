import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from '../../components/common/Card';
import api from '../../config/api';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  RefreshCw, 
  Layers, 
  CreditCard, 
  Search, 
  GraduationCap,
  Calendar,
  DollarSign,
  FileText,
  Printer,
  Download,
  X
} from 'lucide-react';
import { 
  getAcademicYears, 
  createAcademicYear, 
  activateAcademicYear, 
  getTerms 
} from '../../api/fees/academicYear';
import { 
  getFeeCategories, 
  createFeeCategory, 
  updateFeeCategory, 
  deleteFeeCategory 
} from '../../api/fees/feeCategory';
import { 
  getFeeStructures, 
  createFeeStructure, 
  updateFeeStructure, 
  deleteFeeStructure, 
  duplicateFeeStructure 
} from '../../api/fees/feeStructure';
import { 
  getFeePaymentStudents, 
  getStudentTerms, 
  getStudentFees, 
  payFee, 
  getReceipt 
} from '../../api/fees/feePayment';
import { 
  getScholarships, 
  createScholarship, 
  getScholarshipPostings, 
  createScholarshipPosting 
} from '../../api/fees/scholarship';
import { 
  getFeesPendingReport, 
  getFeesPaymentReport, 
  getDailyCollectionReport, 
  getRangeCollectionReport, 
  getScholarshipsReport 
} from '../../api/fees/feeReports';

const getTermLabel = (termName, className) => {
  if (!termName) return '';
  const cleanTerm = termName.toString().trim();
  if (cleanTerm === 'Term 1' || cleanTerm === 'I Term' || cleanTerm.toLowerCase() === 'first term') {
    const cls = className?.toString().toUpperCase().trim() || '';
    if (cls === 'LKG' || cls === 'UKG') {
      return 'First Term (Course Fees, Bag & Book Fees, Miscellaneous Fees, Transportation Fees)';
    }
    return 'First Term (Course Fees, Bag & Book Fees, Miscellaneous Fees)';
  }
  if (cleanTerm === 'Term 2' || cleanTerm === 'II Term') return 'Second Term';
  if (cleanTerm === 'Term 3' || cleanTerm === 'III Term') return 'Third Term';
  return termName;
};

export default function AdminFees() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'years';
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Common Dropdowns & Lists
  const [academicYears, setAcademicYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [classesList] = useState(['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);

  // ==========================================
  // TAB: Academic Year States
  // ==========================================
  const [yearName, setYearName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ==========================================
  // TAB: Fee Category States
  // ==========================================
  const [categoryName, setCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  // ==========================================
  // TAB: Fee Structure States
  // ==========================================
  const [structs, setStructs] = useState([]);
  const [filterYearId, setFilterYearId] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterTermId, setFilterTermId] = useState('');
  const [structModalOpen, setStructModalOpen] = useState(false);
  const [editingStructId, setEditingStructId] = useState(null);
  
  // New Structure Form
  const [structForm, setStructForm] = useState({
    academic_year_id: '',
    school_class: '',
    term_id: '',
    category_id: '',
    amount: ''
  });

  // Duplication Modal Form
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [dupSourceYearId, setDupSourceYearId] = useState('');
  const [dupTargetYearId, setDupTargetYearId] = useState('');

  // ==========================================
  // TAB: Fee Payment States
  // ==========================================
  const [paymentYearId, setPaymentYearId] = useState('');
  const [paymentClass, setPaymentClass] = useState('');
  const [paymentStudents, setPaymentStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentTermsList, setStudentTermsList] = useState([]);
  const [selectedTermId, setSelectedTermId] = useState('');
  const [studentFeesDetail, setStudentFeesDetail] = useState(null);

  // Payment Form Inputs
  const [cashAmount, setCashAmount] = useState(0);
  const [upiAmount, setUpiAmount] = useState(0);
  const [cardAmount, setCardAmount] = useState(0);
  const [generatedReceipt, setGeneratedReceipt] = useState(null);

  // ==========================================
  // TAB: Scholarship States
  // ==========================================
  const [scholarshipsList, setScholarshipsList] = useState([]);
  const [scholarshipName, setScholarshipName] = useState('');
  const [scholarshipPostings, setScholarshipPostings] = useState([]);
  const [postForm, setPostForm] = useState({
    academic_year_id: '',
    student_id: '',
    scholarship_id: '',
    amount: ''
  });
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [searchStudentResult, setSearchStudentResult] = useState(null);
  const [studentNotFoundError, setStudentNotFoundError] = useState(false);

  // ==========================================
  // TAB: Reports States
  // ==========================================
  const [activeReportSubTab, setActiveReportSubTab] = useState('pending'); // pending, payments, daily, range, scholarship
  const [reportData, setReportData] = useState([]);
  const [reportTotalSum, setReportTotalSum] = useState(0);
  const [reportModesList, setReportModesList] = useState([]);
  const [reportDailySummary, setReportDailySummary] = useState(null);

  // Report Filters
  const [repYearId, setRepYearId] = useState('');
  const [repClass, setRepClass] = useState('');
  const [repTermId, setRepTermId] = useState('');
  const [repMode, setRepMode] = useState('');
  const [repDailyDate, setRepDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [repStartDate, setRepStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [repEndDate, setRepEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Load initial dropdowns
  const loadDropdowns = async () => {
    try {
      const yearsData = await getAcademicYears();
      setAcademicYears(yearsData);
      const activeYear = yearsData.find(y => y.status === 'ACTIVE') || yearsData[0];
      if (activeYear) {
        setFilterYearId(activeYear.year_id.toString());
        setPaymentYearId(activeYear.year_id.toString());
        setPostForm(prev => ({ ...prev, academic_year_id: activeYear.year_id.toString() }));
        setRepYearId(activeYear.year_id.toString());
      }

      const termsData = await getTerms();
      setTerms(termsData);

      const catsData = await getFeeCategories();
      setCategories(catsData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadDropdowns();
  }, []);

  // Show error alert helper
  const showError = (e, defaultMsg = 'An error occurred') => {
    const msg = e.response?.data?.detail || e.message || defaultMsg;
    alert(msg);
  };

  // ==========================================
  // TAB ACTIONS: Academic Year
  // ==========================================
  const fetchYearsList = async () => {
    try {
      const data = await getAcademicYears();
      setAcademicYears(data);
    } catch (e) {
      showError(e, 'Failed to fetch academic years');
    }
  };

  const handleSaveYear = async (e) => {
    e.preventDefault();
    if (!yearName || !startDate || !endDate) return;
    
    if (new Date(endDate) <= new Date(startDate)) {
      alert('End date must be after start date');
      return;
    }

    setActionLoading(true);
    try {
      await createAcademicYear({
        year_name: yearName,
        start_date: startDate,
        end_date: endDate
      });
      setYearName('');
      setStartDate('');
      setEndDate('');
      await fetchYearsList();
    } catch (e) {
      showError(e, 'Failed to create academic year');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateYear = async (id) => {
    setActionLoading(true);
    try {
      await activateAcademicYear(id);
      await fetchYearsList();
    } catch (e) {
      showError(e, 'Failed to activate academic year');
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // TAB ACTIONS: Fee Category
  // ==========================================
  const fetchCategoriesList = async () => {
    try {
      const data = await getFeeCategories();
      setCategories(data);
    } catch (e) {
      showError(e, 'Failed to fetch categories');
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setActionLoading(true);
    try {
      if (editingCategoryId) {
        await updateFeeCategory(editingCategoryId, { category_name: categoryName });
        setEditingCategoryId(null);
      } else {
        await createFeeCategory({ category_name: categoryName });
      }
      setCategoryName('');
      await fetchCategoriesList();
    } catch (e) {
      showError(e, 'Failed to save fee category');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    setActionLoading(true);
    try {
      await deleteFeeCategory(id);
      await fetchCategoriesList();
    } catch (e) {
      showError(e, 'Failed to delete fee category');
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // TAB ACTIONS: Fee Structure
  // ==========================================
  const fetchStructuresList = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterYearId) params.academic_year_id = filterYearId;
      if (filterClass) params.school_class = filterClass;
      if (filterTermId) params.term_id = filterTermId;

      const data = await getFeeStructures(params);
      setStructs(data);
    } catch (e) {
      showError(e, 'Failed to fetch structures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'structures') {
      fetchStructuresList();
    }
  }, [activeTab, filterYearId, filterClass, filterTermId]);

  const handleSaveStructure = async (e) => {
    e.preventDefault();
    if (!structForm.academic_year_id || !structForm.school_class || !structForm.term_id || !structForm.category_id || !structForm.amount) return;

    setActionLoading(true);
    try {
      if (editingStructId) {
        await updateFeeStructure(editingStructId, structForm);
        setEditingStructId(null);
      } else {
        await createFeeStructure(structForm);
      }
      setStructModalOpen(false);
      setStructForm({
        academic_year_id: filterYearId || '',
        school_class: filterClass || '',
        term_id: filterTermId || '',
        category_id: '',
        amount: ''
      });
      await fetchStructuresList();
    } catch (e) {
      showError(e, 'Failed to save structure');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStructure = async (id) => {
    if (!window.confirm('Are you sure you want to delete this structure?')) return;
    setActionLoading(true);
    try {
      await deleteFeeStructure(id);
      await fetchStructuresList();
    } catch (e) {
      showError(e, 'Failed to delete structure');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicateStructures = async (e) => {
    e.preventDefault();
    if (!dupSourceYearId || !dupTargetYearId) return;

    setActionLoading(true);
    try {
      const res = await duplicateFeeStructure({
        source_academic_year_id: parseInt(dupSourceYearId),
        target_academic_year_id: parseInt(dupTargetYearId)
      });
      alert(`Successfully duplicated ${res.count} structures.`);
      setDuplicateModalOpen(false);
      await fetchStructuresList();
    } catch (e) {
      showError(e, 'Failed to duplicate structures');
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // TAB ACTIONS: Fee Payment
  // ==========================================
  const handleFetchStudentsForPayment = async () => {
    if (!paymentYearId || !paymentClass) {
      alert('Please select Academic Year and Class');
      return;
    }
    setLoading(true);
    try {
      const data = await getFeePaymentStudents({
        academic_year_id: paymentYearId,
        school_class: paymentClass
      });
      setPaymentStudents(data);
      setSelectedStudent(null);
      setStudentFeesDetail(null);
      setGeneratedReceipt(null);
    } catch (e) {
      showError(e, 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setStudentFeesDetail(null);
    setGeneratedReceipt(null);
    try {
      const termData = await getStudentTerms(student.id, { academic_year_id: paymentYearId });
      setStudentTermsList(termData);
      if (termData.length > 0) {
        setSelectedTermId(termData[0].term_id.toString());
      } else {
        setSelectedTermId('');
      }
    } catch (e) {
      showError(e, 'Failed to fetch student terms');
    }
  };

  const handleFetchStudentFees = async () => {
    if (!selectedStudent || !selectedTermId) return;
    try {
      const data = await getStudentFees(selectedStudent.id, {
        academic_year_id: paymentYearId,
        term_id: selectedTermId
      });
      setStudentFeesDetail(data);
      setCashAmount(0);
      setUpiAmount(0);
      setCardAmount(0);
    } catch (e) {
      showError(e, 'Failed to fetch student fee details');
    }
  };

  useEffect(() => {
    if (selectedStudent && selectedTermId) {
      handleFetchStudentFees();
    }
  }, [selectedStudent, selectedTermId]);

  const handleCollectPayment = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !selectedTermId) return;

    setActionLoading(true);
    try {
      const res = await payFee({
        student_id: selectedStudent.id,
        term_id: parseInt(selectedTermId),
        academic_year_id: parseInt(paymentYearId),
        cash_amount: parseFloat(cashAmount) || 0,
        upi_amount: parseFloat(upiAmount) || 0,
        card_amount: parseFloat(cardAmount) || 0
      });
      alert(`Payment successful! Receipt: ${res.receipt_no}`);
      
      // Fetch full receipt details
      const receiptData = await getReceipt(res.receipt_no);
      setGeneratedReceipt(receiptData);
      
      // Refresh current fees table
      await handleFetchStudentFees();
    } catch (e) {
      showError(e, 'Payment failed');
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // TAB ACTIONS: Scholarships
  // ==========================================
  const fetchScholarshipsList = async () => {
    try {
      const data = await getScholarships();
      setScholarshipsList(data);
    } catch (e) {
      showError(e, 'Failed to fetch scholarships');
    }
  };

  const fetchScholarshipPostingsList = async () => {
    try {
      const data = await getScholarshipPostings();
      setScholarshipPostings(data);
    } catch (e) {
      showError(e, 'Failed to fetch scholarship postings');
    }
  };

  useEffect(() => {
    if (activeTab === 'scholarships') {
      fetchScholarshipsList();
      fetchScholarshipPostingsList();
    }
  }, [activeTab]);

  const handleCreateScholarshipName = async (e) => {
    e.preventDefault();
    if (!scholarshipName.trim()) return;

    setActionLoading(true);
    try {
      await createScholarship({ name: scholarshipName });
      setScholarshipName('');
      await fetchScholarshipsList();
    } catch (e) {
      showError(e, 'Failed to create scholarship');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearchStudent = async () => {
    if (!studentSearchTerm.trim()) return;
    setSearchStudentResult(null);
    setStudentNotFoundError(false);
    try {
      const response = await api.get('/api/v1/admin/students', {
        params: { limit: 1000 }
      });
      const students = response.data;
      const term = studentSearchTerm.trim().toLowerCase();
      const match = students.find(
        s => 
          (s.student_id && s.student_id.toLowerCase() === term) ||
          (s.roll_number && s.roll_number.toLowerCase() === term)
      );
      if (match) {
        setSearchStudentResult(match);
        setPostForm(prev => ({ ...prev, student_id: match.student_id }));
      } else {
        setStudentNotFoundError(true);
      }
    } catch (e) {
      showError(e, 'Failed to query student');
    }
  };

  const handlePostScholarship = async (e) => {
    e.preventDefault();
    if (!postForm.academic_year_id || !postForm.student_id || !postForm.scholarship_id || !postForm.amount) return;

    setActionLoading(true);
    try {
      await createScholarshipPosting(postForm);
      alert('Scholarship posted successfully!');
      setPostForm({
        academic_year_id: paymentYearId,
        student_id: '',
        scholarship_id: '',
        amount: ''
      });
      setStudentSearchTerm('');
      setSearchStudentResult(null);
      setStudentNotFoundError(false);
      await fetchScholarshipPostingsList();
    } catch (e) {
      showError(e, 'Failed to post scholarship');
    } finally {
      setActionLoading(false);
    }
  };
  // ==========================================

  const handleGenerateReport = async () => {
    // Prevent calling API with empty academic year ID for tabs that require it
    if (['pending', 'payments', 'scholarship'].includes(activeReportSubTab) && !repYearId) {
      console.log("handleGenerateReport: Skipping API call because repYearId is empty");
      return;
    }

    console.log("Generating report for:", {
      activeReportSubTab,
      repYearId,
      repClass,
      repTermId,
      repMode,
      repDailyDate,
      repStartDate,
      repEndDate
    });

    setLoading(true);
    try {
      let data;
      if (activeReportSubTab === 'pending') {
        data = await getFeesPendingReport({
          academic_year_id: parseInt(repYearId, 10),
          school_class: repClass || undefined,
          term_id: repTermId ? parseInt(repTermId, 10) : undefined
        });
        setReportData(data.rows || []);
        setReportTotalSum(data.total_pending || 0);
      } else if (activeReportSubTab === 'payments') {
        data = await getFeesPaymentReport({
          academic_year_id: parseInt(repYearId, 10),
          school_class: repClass || undefined,
          term_id: repTermId ? parseInt(repTermId, 10) : undefined,
          payment_mode: repMode || undefined
        });
        setReportData(data.rows || []);
        setReportTotalSum(data.total_paid || 0);
        setReportModesList(data.payment_modes_in_result || []);
      } else if (activeReportSubTab === 'daily') {
        data = await getDailyCollectionReport({
          date: repDailyDate,
          payment_mode: repMode || undefined
        });
        setReportData(data.rows || []);
        setReportDailySummary(data.summary);
        setReportTotalSum(data.summary?.grand_total || 0);
      } else if (activeReportSubTab === 'range') {
        data = await getRangeCollectionReport({
          start_date: repStartDate,
          end_date: repEndDate,
          payment_mode: repMode || undefined
        });
        setReportData(data.rows || []);
        setReportDailySummary(data.summary);
        setReportTotalSum(data.summary?.grand_total || 0);
      } else if (activeReportSubTab === 'scholarship') {
        data = await getScholarshipsReport({
          academic_year_id: repYearId ? parseInt(repYearId, 10) : undefined,
          school_class: repClass || undefined
        });
        setReportData(data.rows || []);
        setReportTotalSum(data.total_scholarship || 0);
      }
    } catch (e) {
      showError(e, 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reports') {
      handleGenerateReport();
    }
  }, [activeTab, activeReportSubTab, repYearId, repClass, repTermId, repMode, repDailyDate, repStartDate, repEndDate]);

  const handleExportCSV = () => {
    if (reportData.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    let headers = [];
    let rows = [];

    if (activeReportSubTab === 'pending') {
      headers = ['Student Name', 'Roll No', 'Class', 'Year', 'Term', 'Category', 'Total Fee', 'Paid', 'Pending'];
      rows = reportData.map(r => [r.student_name, r.roll_no, r.school_class, r.year_name, r.term_name, r.category_name, r.total_fee, r.paid, r.pending]);
    } else if (activeReportSubTab === 'payments') {
      headers = ['Receipt No', 'Date', 'Student Name', 'Roll No', 'Class', 'Term', 'Category', 'Amount Paid', 'Mode'];
      rows = reportData.map(r => [r.receipt_no, r.payment_date, r.student_name, r.roll_no, r.school_class, r.term_name, r.category_name, r.amount_paid, r.payment_mode]);
    } else if (['daily', 'range'].includes(activeReportSubTab)) {
      headers = ['Receipt No', 'Date', 'Student Name', 'Roll No', 'Class', 'Term', 'Category', 'Amount Paid', 'Mode'];
      rows = reportData.map(r => [r.receipt_no, r.payment_date, r.student_name, r.roll_no, r.school_class, r.term_name, r.category_name, r.amount_paid, r.payment_mode]);
    } else if (activeReportSubTab === 'scholarship') {
      headers = ['Student Name', 'Roll No', 'Class', 'Scholarship Name', 'Year', 'Amount'];
      rows = reportData.map(r => [r.student_name, r.roll_no, r.school_class, r.scholarship_name, r.year_name, r.amount]);
    }

    csvContent += headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(val => `"${val}"`).join(',') + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeReportSubTab}_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 no-print">
      {/* Title */}
      <div className="flex justify-between items-center text-schoolGreen">
        <div>
          <h1 className="text-3xl font-black mb-2 flex items-center gap-2">
            <DollarSign size={32} className="text-schoolYellow" /> Fee Management ERP
          </h1>
          <p className="text-gray-600 font-medium">Rebuilt Year-Term-Category Direct ledger module</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-gray-200">
        {[
          { id: 'years', label: 'Academic Years', icon: Calendar },
          { id: 'categories', label: 'Fee Categories', icon: Layers },
          { id: 'structures', label: 'Fee Structures', icon: FileText },
          { id: 'payments', label: 'Collect Payments', icon: CreditCard },
          { id: 'scholarships', label: 'Scholarships', icon: GraduationCap },
          { id: 'reports', label: 'Financial Reports', icon: FileText }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold transition ${
                activeTab === tab.id 
                  ? 'border-schoolGreen text-schoolGreen bg-green-50/40' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content tabs */}
      {activeTab === 'years' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1">
            <h2 className="text-xl font-bold text-schoolGreen mb-6">Create Session</h2>
            <form onSubmit={handleSaveYear} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Year Name</label>
                <input
                  type="text"
                  placeholder="e.g. 2024-2025"
                  value={yearName}
                  onChange={e => setYearName(e.target.value)}
                  className="w-full p-2.5 border rounded-xl outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full p-2.5 border rounded-xl outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full p-2.5 border rounded-xl outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 bg-schoolGreen text-white font-bold rounded-xl hover:bg-opacity-90 disabled:opacity-50 transition"
              >
                Save Academic Year
              </button>
            </form>
          </Card>

          <Card className="lg:col-span-2">
            <h2 className="text-xl font-bold text-schoolGreen mb-6">Sessions List</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-[10px] text-gray-400 uppercase font-bold">
                    <th className="py-2.5 text-left">Year Name</th>
                    <th className="py-2.5 text-left">Start Date</th>
                    <th className="py-2.5 text-left">End Date</th>
                    <th className="py-2.5 text-center">Status</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {academicYears.length === 0 ? (
                    <tr><td colSpan="5" className="py-8 text-center text-gray-400 italic">No records found</td></tr>
                  ) : (
                    academicYears.map(ay => (
                      <tr key={ay.year_id} className="border-b hover:bg-gray-50/50">
                        <td className="py-3 font-bold text-gray-900">{ay.year_name}</td>
                        <td className="py-3 text-gray-600">{ay.start_date}</td>
                        <td className="py-3 text-gray-600">{ay.end_date}</td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            ay.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                          }`}>
                            {ay.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {ay.status !== 'ACTIVE' && (
                            <button
                              onClick={() => handleActivateYear(ay.year_id)}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-schoolGreen text-white font-bold rounded-lg text-xs hover:bg-opacity-90 disabled:opacity-50"
                            >
                              Activate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1">
            <h2 className="text-xl font-bold text-schoolGreen mb-6">
              {editingCategoryId ? 'Edit Category' : 'Create Category'}
            </h2>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Tuition Fee"
                  value={categoryName}
                  onChange={e => setCategoryName(e.target.value)}
                  className="w-full p-2.5 border rounded-xl outline-none"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-schoolGreen text-white font-bold rounded-xl hover:bg-opacity-90 disabled:opacity-50 transition"
                >
                  Save
                </button>
                {editingCategoryId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategoryId(null);
                      setCategoryName('');
                    }}
                    className="py-2.5 px-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-250 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </Card>

          <Card className="lg:col-span-2">
            <h2 className="text-xl font-bold text-schoolGreen mb-6">Categories List</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-[10px] text-gray-400 uppercase font-bold">
                    <th className="py-2.5 text-left">Category ID</th>
                    <th className="py-2.5 text-left">Category Name</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr><td colSpan="3" className="py-8 text-center text-gray-400 italic">No records found</td></tr>
                  ) : (
                    categories.map(cat => (
                      <tr key={cat.category_id} className="border-b hover:bg-gray-50/50">
                        <td className="py-3 font-semibold text-gray-500">#{cat.category_id}</td>
                        <td className="py-3 font-bold text-gray-900">{cat.category_name}</td>
                        <td className="py-3 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingCategoryId(cat.category_id);
                              setCategoryName(cat.category_name);
                            }}
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.category_id)}
                            disabled={actionLoading}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'structures' && (
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap gap-4 items-end justify-between">
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Academic Year</label>
                  <select
                    value={filterYearId}
                    onChange={e => setFilterYearId(e.target.value)}
                    className="p-2 border rounded-xl outline-none font-bold text-gray-700"
                  >
                    <option value="">Select Year</option>
                    {academicYears.map(y => <option key={y.year_id} value={y.year_id}>{y.year_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Class</label>
                  <select
                    value={filterClass}
                    onChange={e => setFilterClass(e.target.value)}
                    className="p-2 border rounded-xl outline-none font-bold text-gray-700"
                  >
                    <option value="">All Classes</option>
                    {classesList.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Term</label>
                  <select
                    value={filterTermId}
                    onChange={e => setFilterTermId(e.target.value)}
                    className="p-2 border rounded-xl outline-none font-bold text-gray-700"
                  >
                    <option value="">All Terms</option>
                    {terms.map(t => <option key={t.term_id} value={t.term_id}>{getTermLabel(t.term_name, filterClass)}</option>)}
                  </select>
                </div>
                <button
                  onClick={fetchStructuresList}
                  className="px-4 py-2 bg-gray-50 border rounded-xl hover:bg-gray-100 text-gray-700 font-bold transition flex items-center gap-1.5"
                >
                  <RefreshCw size={16} />
                  Filter
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingStructId(null);
                    setStructForm({
                      academic_year_id: filterYearId || '',
                      school_class: filterClass || '',
                      term_id: filterTermId || '',
                      category_id: '',
                      amount: ''
                    });
                    setStructModalOpen(true);
                  }}
                  className="px-4 py-2 bg-schoolGreen text-white font-bold rounded-xl hover:bg-opacity-95 transition flex items-center gap-1.5"
                >
                  <Plus size={16} />
                  Add Structure
                </button>
                <button
                  onClick={() => {
                    setDupSourceYearId(filterYearId || '');
                    setDuplicateModalOpen(true);
                  }}
                  className="px-4 py-2 bg-yellow-50 border border-yellow-250 text-yellow-700 font-bold rounded-xl hover:bg-yellow-100 transition flex items-center gap-1.5"
                >
                  <Layers size={16} />
                  Duplicate Cloner
                </button>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-bold text-schoolGreen mb-6">Structures Configured</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-[10px] text-gray-400 uppercase font-bold">
                    <th className="py-2.5 text-left">Academic Year</th>
                    <th className="py-2.5 text-left">Class</th>
                    <th className="py-2.5 text-left">Term</th>
                    <th className="py-2.5 text-left">Category</th>
                    <th className="py-2.5 text-right">Amount (₹)</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="6" className="py-12 text-center italic text-gray-400">Loading structures...</td></tr>
                  ) : structs.length === 0 ? (
                    <tr><td colSpan="6" className="py-12 text-center text-gray-400 italic">No records found</td></tr>
                  ) : (
                    structs.map(st => (
                      <tr key={st.id} className="border-b hover:bg-gray-50/50">
                        <td className="py-3 font-semibold text-gray-700">{st.year_name}</td>
                        <td className="py-3 font-bold text-schoolGreen">Class {st.school_class}</td>
                        <td className="py-3 font-semibold text-gray-600">{getTermLabel(st.term_name, st.school_class)}</td>
                        <td className="py-3 font-bold text-gray-900">{st.category_name}</td>
                        <td className="py-3 text-right font-bold text-gray-900">₹{st.amount.toLocaleString()}</td>
                        <td className="py-3 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingStructId(st.id);
                              setStructForm({
                                academic_year_id: st.academic_year_id.toString(),
                                school_class: st.school_class,
                                term_id: st.term_id.toString(),
                                category_id: st.category_id.toString(),
                                amount: st.amount.toString()
                              });
                              setStructModalOpen(true);
                            }}
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteStructure(st.id)}
                            disabled={actionLoading}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* New Structure Modal */}
          {structModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="max-w-md w-full animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-schoolGreen">
                    {editingStructId ? 'Edit Fee Structure' : 'Add Fee Structure'}
                  </h3>
                  <button onClick={() => setStructModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSaveStructure} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Academic Year</label>
                    <select
                      value={structForm.academic_year_id}
                      onChange={e => setStructForm(prev => ({ ...prev, academic_year_id: e.target.value }))}
                      className="w-full p-2.5 border rounded-xl outline-none"
                      required
                    >
                      <option value="">Select Year</option>
                      {academicYears.map(y => <option key={y.year_id} value={y.year_id}>{y.year_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Class</label>
                    <select
                      value={structForm.school_class}
                      onChange={e => setStructForm(prev => ({ ...prev, school_class: e.target.value }))}
                      className="w-full p-2.5 border rounded-xl outline-none"
                      required
                    >
                      <option value="">Select Class</option>
                      {classesList.map(c => <option key={c} value={c}>Class {c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Term</label>
                    <select
                      value={structForm.term_id}
                      onChange={e => setStructForm(prev => ({ ...prev, term_id: e.target.value }))}
                      className="w-full p-2.5 border rounded-xl outline-none"
                      required
                    >
                      <option value="">Select Term</option>
                      {terms.map(t => <option key={t.term_id} value={t.term_id}>{getTermLabel(t.term_name, structForm.school_class)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Category</label>
                    <select
                      value={structForm.category_id}
                      onChange={e => setStructForm(prev => ({ ...prev, category_id: e.target.value }))}
                      className="w-full p-2.5 border rounded-xl outline-none"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Amount (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 5000"
                      value={structForm.amount}
                      onChange={e => setStructForm(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full p-2.5 border rounded-xl outline-none"
                      required
                    />
                  </div>
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex-1 py-2.5 bg-schoolGreen text-white font-bold rounded-xl hover:bg-opacity-95 transition disabled:opacity-50"
                    >
                      Save Structure
                    </button>
                    <button
                      type="button"
                      onClick={() => setStructModalOpen(false)}
                      className="px-5 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-250 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </Card>
            </div>
          )}

          {/* Duplicator Cloner Modal */}
          {duplicateModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="max-w-md w-full animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-schoolGreen">Cloner Duplicator</h3>
                  <button onClick={() => setDuplicateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleDuplicateStructures} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Source Year</label>
                    <select
                      value={dupSourceYearId}
                      onChange={e => setDupSourceYearId(e.target.value)}
                      className="w-full p-2.5 border rounded-xl outline-none"
                      required
                    >
                      <option value="">Select Year</option>
                      {academicYears.map(y => <option key={y.year_id} value={y.year_id}>{y.year_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Target Year</label>
                    <select
                      value={dupTargetYearId}
                      onChange={e => setDupTargetYearId(e.target.value)}
                      className="w-full p-2.5 border rounded-xl outline-none"
                      required
                    >
                      <option value="">Select Year</option>
                      {academicYears.map(y => <option key={y.year_id} value={y.year_id}>{y.year_name}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex-1 py-2.5 bg-schoolGreen text-white font-bold rounded-xl hover:bg-opacity-95 transition disabled:opacity-50"
                    >
                      Clone Structures
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuplicateModalOpen(false)}
                      className="px-5 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-250 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {/* Left panel: Filter */}
          <div className="md:col-span-1 space-y-6">
            <Card>
              <h2 className="text-xl font-bold text-schoolGreen mb-4">Search Students</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Academic Year</label>
                  <select
                    value={paymentYearId}
                    onChange={e => setPaymentYearId(e.target.value)}
                    className="w-full p-2 border rounded-xl outline-none font-bold text-gray-700"
                  >
                    {academicYears.map(y => <option key={y.year_id} value={y.year_id}>{y.year_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Class</label>
                  <select
                    value={paymentClass}
                    onChange={e => setPaymentClass(e.target.value)}
                    className="w-full p-2 border rounded-xl outline-none font-bold text-gray-700"
                  >
                    <option value="">Select Class</option>
                    {classesList.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
                <button
                  onClick={handleFetchStudentsForPayment}
                  className="w-full py-2.5 bg-schoolGreen text-white font-bold rounded-xl hover:bg-opacity-90 transition flex items-center justify-center gap-1.5 shadow-md shadow-schoolGreen/20"
                >
                  <Search size={18} />
                  Fetch Students
                </button>
              </div>
            </Card>
          </div>

          {/* Middle panel: student list */}
          <div className="md:col-span-1 lg:col-span-1 space-y-6">
            <Card>
              <h2 className="text-xl font-bold text-schoolGreen mb-4">Students List</h2>
              <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
                {paymentStudents.length === 0 ? (
                  <p className="text-gray-400 italic text-center py-8">No students found</p>
                ) : (
                  paymentStudents.map(st => (
                    <button
                      key={st.id}
                      onClick={() => handleSelectStudent(st)}
                      className={`w-full text-left p-3 rounded-xl border transition flex flex-col ${
                        selectedStudent?.id === st.id 
                          ? 'border-schoolGreen bg-green-50/50' 
                          : 'border-gray-150 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-bold text-gray-900">{st.name}</span>
                      <span className="text-xs text-gray-500 font-semibold">Roll No: {st.roll_no || 'N/A'}</span>
                    </button>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Right panel: Fees detail & Payment */}
          <div className="md:col-span-3 lg:col-span-2 space-y-6">
            {!selectedStudent ? (
              <Card className="flex flex-col items-center justify-center py-24 text-gray-400">
                <Search size={48} className="mb-4 opacity-30" />
                <p className="text-lg font-bold">Select a student from the list to manage payments</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Term selector pills */}
                <Card>
                  <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <div>
                      <h2 className="text-xl font-bold text-schoolGreen">{selectedStudent.name}</h2>
                      <p className="text-xs text-gray-500 font-semibold">Class {selectedStudent.school_class} | Roll No: {selectedStudent.roll_no || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {studentTermsList.length === 0 ? (
                      <p className="text-gray-400 italic">No terms configured for this class</p>
                    ) : (
                      studentTermsList.map(t => (
                        <button
                          key={t.term_id}
                          onClick={() => setSelectedTermId(t.term_id.toString())}
                          className={`px-5 py-2.5 font-bold rounded-xl transition ${
                            selectedTermId === t.term_id.toString()
                              ? 'bg-schoolGreen text-white shadow-md'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {getTermLabel(t.term_name, selectedStudent?.school_class)}
                        </button>
                      ))
                    )}
                  </div>
                </Card>

                {studentFeesDetail && (
                  <>
                    {/* Paid & Pending Summary Widgets */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-green-50/70 border border-green-200 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Paid Amount</span>
                          <span className="text-2xl font-black text-green-700 mt-1 block">₹{studentFeesDetail.aggregates.total_paid.toLocaleString()}</span>
                        </div>
                        <div className="p-2 bg-green-100 rounded-xl text-green-700 font-extrabold">
                          <CreditCard size={20} />
                        </div>
                      </div>
                      <div className="p-4 bg-red-50/70 border border-red-200 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Pending Amount</span>
                          <span className="text-2xl font-black text-red-600 mt-1 block">₹{studentFeesDetail.aggregates.total_balance.toLocaleString()}</span>
                        </div>
                        <div className="p-2 bg-red-100 rounded-xl text-red-650 font-extrabold">
                          <DollarSign size={20} />
                        </div>
                      </div>
                    </div>

                    {/* Fee detail table */}
                    <Card>
                      <h3 className="text-lg font-bold text-schoolGreen mb-4">Fee Structure Details</h3>
                      <div className="overflow-x-auto mb-4">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-[10px] text-gray-400 uppercase font-bold">
                              <th className="py-2.5 text-left">Category</th>
                              <th className="py-2.5 text-right">Scholarship</th>
                              <th className="py-2.5 text-right">Total</th>
                              <th className="py-2.5 text-right">Paid</th>
                              <th className="py-2.5 text-right">Balance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentFeesDetail.fees.map(f => (
                              <tr
                                key={f.fee_structure_id}
                                className={`border-b ${
                                  f.balance === 0 ? 'bg-green-50/20' : 'bg-amber-50/10'
                                }`}
                              >
                                <td className="py-3 font-bold text-gray-800">{f.category_name}</td>
                                <td className="py-3 text-right text-yellow-600 font-semibold">₹{f.scholarship_applied.toLocaleString()}</td>
                                <td className="py-3 text-right font-medium text-gray-600">₹{f.total.toLocaleString()}</td>
                                <td className="py-3 text-right font-bold text-green-600">₹{f.paid.toLocaleString()}</td>
                                <td className={`py-3 text-right font-extrabold ${f.balance > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                                  ₹{f.balance.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                            <tr className="font-bold border-t-2 border-gray-250 bg-gray-50/40">
                              <td className="py-3">TOTAL</td>
                              <td className="py-3 text-right text-yellow-600">₹{studentFeesDetail.aggregates.total_scholarship_applied.toLocaleString()}</td>
                              <td className="py-3 text-right text-gray-600">₹{studentFeesDetail.aggregates.grand_total.toLocaleString()}</td>
                              <td className="py-3 text-right text-green-600">₹{studentFeesDetail.aggregates.total_paid.toLocaleString()}</td>
                              <td className="py-3 text-right text-schoolGreen">₹{studentFeesDetail.aggregates.total_balance.toLocaleString()}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="p-3 bg-yellow-50/80 border border-yellow-200 rounded-xl flex items-center gap-2 text-xs font-bold text-yellow-750">
                        <GraduationCap size={16} />
                        <span>
                          Scholarship Available: ₹{studentFeesDetail.aggregates.total_scholarship_posted.toLocaleString()} | 
                          Remaining: ₹{studentFeesDetail.aggregates.remaining_scholarship.toLocaleString()}
                        </span>
                      </div>
                    </Card>

                    {/* Payment History */}
                    {studentFeesDetail.payment_history && studentFeesDetail.payment_history.length > 0 && (
                      <Card>
                        <h3 className="text-lg font-bold text-schoolGreen mb-4">Payment History</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b text-[10px] text-gray-400 uppercase font-bold">
                                <th className="py-2.5 text-left">Receipt No</th>
                                <th className="py-2.5 text-left">Date</th>
                                <th className="py-2.5 text-left">Mode</th>
                                <th className="py-2.5 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentFeesDetail.payment_history.map(hist => (
                                <tr key={hist.receipt_no} className="border-b hover:bg-gray-50/50">
                                  <td className="py-3 font-bold text-schoolGreen">{hist.receipt_no}</td>
                                  <td className="py-3 text-gray-600">{hist.date}</td>
                                  <td className="py-3 text-gray-500 uppercase text-xs font-semibold">{hist.payment_mode}</td>
                                  <td className="py-3 text-right font-bold text-gray-900">₹{hist.amount.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    )}

                    {/* Pay Form */}
                    {studentFeesDetail.aggregates.total_balance > 0 && (
                      <Card>
                        <h3 className="text-lg font-bold text-schoolGreen mb-4">Record Payment</h3>
                        <form onSubmit={handleCollectPayment} className="space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Cash Amount</label>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={cashAmount}
                                onChange={e => setCashAmount(parseFloat(e.target.value) || 0)}
                                className="w-full p-2 border rounded-xl outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">UPI Amount</label>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={upiAmount}
                                onChange={e => setUpiAmount(parseFloat(e.target.value) || 0)}
                                className="w-full p-2 border rounded-xl outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Card Amount</label>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={cardAmount}
                                onChange={e => setCardAmount(parseFloat(e.target.value) || 0)}
                                className="w-full p-2 border rounded-xl outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-3 border-t">
                            <span className="font-bold text-gray-700">Total paying: <span className="text-xl font-black text-schoolGreen">₹{(cashAmount + upiAmount + cardAmount).toLocaleString()}</span></span>
                            <button
                              type="submit"
                              disabled={actionLoading || (cashAmount + upiAmount + cardAmount) <= 0}
                              className="px-6 py-2.5 bg-schoolGreen text-white font-bold rounded-xl hover:bg-opacity-95 transition disabled:opacity-50 flex items-center gap-1.5 shadow"
                            >
                              <CreditCard size={18} />
                              Pay
                            </button>
                          </div>
                        </form>
                      </Card>
                    )}
                  </>
                )}

                {/* Print Receipt Sheet */}
                {generatedReceipt && (
                  <Card className="receipt-content bg-white p-8 border border-gray-300 max-w-2xl mx-auto rounded-none shadow-none text-gray-800">
                    {/* Header */}
                    <div className="text-center border-b pb-4 mb-4">
                      <h2 className="text-2xl font-black tracking-wide text-schoolGreen">{generatedReceipt.school.name}</h2>
                      <p className="text-xs text-gray-500 font-semibold">{generatedReceipt.school.address} | Phone: {generatedReceipt.school.phone}</p>
                      <h4 className="mt-4 inline-block px-4 py-1 bg-gray-100 rounded-lg text-sm font-black uppercase text-gray-700 tracking-wider">Fee Payment Receipt</h4>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-y-2 text-sm mb-6 pb-4 border-b">
                      <div>
                        <span className="font-bold text-gray-400 block text-xs uppercase">Receipt No</span>
                        <span className="font-black text-base text-schoolGreen">{generatedReceipt.receipt_no}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-gray-400 block text-xs uppercase">Payment Date</span>
                        <span className="font-semibold">{new Date(generatedReceipt.payment_date).toLocaleString()}</span>
                      </div>
                      <div className="mt-2">
                        <span className="font-bold text-gray-400 block text-xs uppercase">Student Name</span>
                        <span className="font-bold text-gray-800">{generatedReceipt.student.name}</span>
                      </div>
                      <div className="text-right mt-2">
                        <span className="font-bold text-gray-400 block text-xs uppercase">Class & Roll No</span>
                        <span className="font-bold text-gray-800">Class {generatedReceipt.student.school_class} | {generatedReceipt.student.roll_no || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Payment Rows */}
                    <table className="w-full text-sm mb-6 border-b pb-4">
                      <thead>
                        <tr className="border-b text-[10px] text-gray-400 uppercase font-black">
                          <th className="py-2 text-left">Category</th>
                          <th className="py-2 text-right">Amount Paid</th>
                          <th className="py-2 text-right">Mode</th>
                        </tr>
                      </thead>
                      <tbody>
                        {generatedReceipt.receipt_rows.map((row, idx) => (
                          <tr key={idx}>
                            <td className="py-2 font-bold">{row.category_name}</td>
                            <td className="py-2 text-right font-semibold">₹{row.amount_paid.toLocaleString()}</td>
                            <td className="py-2 text-right text-xs uppercase font-bold text-gray-500">{row.payment_mode}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-between items-start text-sm mb-8">
                      <div className="space-y-1 bg-gray-50 p-3 rounded-lg border">
                        <span className="font-bold text-xs text-gray-400 uppercase block">Mode Summary</span>
                        <div className="flex gap-4 text-xs font-bold text-gray-600">
                          {Object.entries(generatedReceipt.mode_totals).map(([mode, amt]) => (
                            <span key={mode}>{mode}: ₹{amt.toLocaleString()}</span>
                          ))}
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <span className="text-gray-500 block font-medium">Total Paid: <span className="font-black text-lg text-gray-900">₹{generatedReceipt.total_paid_this_receipt.toLocaleString()}</span></span>
                        <span className="text-xs text-red-600 font-bold block">Term Balance After: ₹{generatedReceipt.term_total_balance.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Actions button - Hidden on Print */}
                    <div className="flex justify-end gap-2 no-print border-t pt-4">
                      <button
                        onClick={() => window.print()}
                        className="px-5 py-2.5 bg-schoolGreen text-white font-bold rounded-xl hover:bg-opacity-95 transition flex items-center gap-1.5 shadow"
                      >
                        <Printer size={16} />
                        Print Receipt
                      </button>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'scholarships' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* sub-section 1: Scholarship Name list */}
            <Card className="lg:col-span-1">
              <h2 className="text-xl font-bold text-schoolGreen mb-6">Create Scholarship</h2>
              <form onSubmit={handleCreateScholarshipName} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Scholarship Name</label>
                  <input
                    type="text"
                    placeholder="e.g. SC/ST Scholarship"
                    value={scholarshipName}
                    onChange={e => setScholarshipName(e.target.value)}
                    className="w-full p-2.5 border rounded-xl outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-2.5 bg-schoolGreen text-white font-bold rounded-xl hover:bg-opacity-90 transition disabled:opacity-50"
                >
                  Create
                </button>
              </form>

              <h3 className="text-lg font-bold text-schoolGreen mt-8 mb-4 border-t pt-4">Scholarships List</h3>
              <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                {scholarshipsList.length === 0 ? (
                  <p className="text-gray-400 italic text-center py-4">No records found</p>
                ) : (
                  scholarshipsList.map(sch => (
                    <div key={sch.id} className="p-3 bg-gray-50 border rounded-xl text-sm font-bold text-gray-800">
                      {sch.name}
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* sub-section 2: Post Scholarship Form */}
            <Card className="lg:col-span-2">
              <h2 className="text-xl font-bold text-schoolGreen mb-6">Post Student Scholarship</h2>
              <form onSubmit={handlePostScholarship} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Academic Year</label>
                    <select
                      value={postForm.academic_year_id}
                      onChange={e => setPostForm(prev => ({ ...prev, academic_year_id: e.target.value }))}
                      className="w-full p-2.5 border rounded-xl outline-none bg-white font-bold text-gray-700"
                      required
                    >
                      <option value="">Select Year</option>
                      {academicYears.map(y => <option key={y.year_id} value={y.year_id}>{y.year_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Scholarship Category</label>
                    <select
                      value={postForm.scholarship_id}
                      onChange={e => setPostForm(prev => ({ ...prev, scholarship_id: e.target.value }))}
                      className="w-full p-2.5 border rounded-xl outline-none bg-white font-bold text-gray-700"
                      required
                    >
                      <option value="">Select Scholarship</option>
                      {scholarshipsList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Student ID / Roll No</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. GPS001"
                      value={studentSearchTerm}
                      onChange={e => setStudentSearchTerm(e.target.value)}
                      className="flex-1 p-2.5 border rounded-xl outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSearchStudent}
                      className="px-5 bg-schoolGreen text-white font-bold rounded-xl hover:bg-opacity-95 transition flex items-center gap-1.5 shadow"
                    >
                      <Search size={16} />
                      Search
                    </button>
                  </div>
                </div>

                {searchStudentResult && (
                  <div className="p-4 bg-gray-50 border rounded-xl space-y-3 relative">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="text-xs font-black uppercase text-schoolGreen tracking-wider">Verified Student Details</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchStudentResult(null);
                          setPostForm(prev => ({ ...prev, student_id: '' }));
                        }}
                        className="text-red-500 hover:text-red-700 font-bold text-xs uppercase"
                      >
                        Clear Selection
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-4 text-sm">
                      <div>
                        <span className="font-bold text-gray-400 block text-[10px] uppercase tracking-wider">Student Name</span>
                        <span className="font-bold text-gray-800">{searchStudentResult.first_name} {searchStudentResult.last_name}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-400 block text-[10px] uppercase tracking-wider">Roll Number</span>
                        <span className="font-bold text-gray-800">{searchStudentResult.roll_number || searchStudentResult.roll_no || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-400 block text-[10px] uppercase tracking-wider">Class & Section</span>
                        <span className="font-bold text-gray-800">Class {searchStudentResult.class_ || searchStudentResult.school_class} - {searchStudentResult.section || 'A'}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-400 block text-[10px] uppercase tracking-wider">Academic Year</span>
                        <span className="font-bold text-gray-800">{searchStudentResult.academic_year || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {studentNotFoundError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold">
                    No student found with the entered Student ID/Roll Number.
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Scholarship Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1000.00"
                    value={postForm.amount}
                    onChange={e => setPostForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full p-2.5 border rounded-xl outline-none"
                    required
                  />
                </div>

                <div className="p-3 bg-blue-50/50 border rounded-xl text-xs text-blue-750 font-bold">
                  ℹ Scholarship will be applied automatically to the student's next fee payment transaction.
                </div>

                <button
                  type="submit"
                  disabled={actionLoading || !postForm.student_id}
                  className="w-full py-2.5 bg-schoolGreen text-white font-bold rounded-xl hover:bg-opacity-90 transition disabled:opacity-50 shadow"
                >
                  Post Scholarship
                </button>
              </form>
            </Card>
          </div>

          {/* Sub-section 3: Postings Table */}
          <Card>
            <h2 className="text-xl font-bold text-schoolGreen mb-6">Existing Postings List</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-[10px] text-gray-400 uppercase font-bold">
                    <th className="py-2.5 text-left">Student</th>
                    <th className="py-2.5 text-left">Roll No</th>
                    <th className="py-2.5 text-left">Class</th>
                    <th className="py-2.5 text-left">Scholarship Name</th>
                    <th className="py-2.5 text-left">Academic Year</th>
                    <th className="py-2.5 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {scholarshipPostings.length === 0 ? (
                    <tr><td colSpan="6" className="py-8 text-center text-gray-400 italic">No records found</td></tr>
                  ) : (
                    scholarshipPostings.map(post => (
                      <tr key={post.id} className="border-b hover:bg-gray-50/50">
                        <td className="py-3 font-bold text-gray-900">{post.student_name}</td>
                        <td className="py-3 font-semibold text-gray-500">{post.roll_no}</td>
                        <td className="py-3 font-semibold text-schoolGreen">Class {post.school_class}</td>
                        <td className="py-3 font-bold text-gray-800">{post.scholarship_name}</td>
                        <td className="py-3 text-gray-600">{post.year_name}</td>
                        <td className="py-3 text-right font-bold text-gray-900">₹{post.amount.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Sub tabs for reports */}
          <div className="flex flex-wrap gap-2 border-b pb-3">
            {[
              { id: 'pending', label: 'Fee Pending' },
              { id: 'payments', label: 'Payment Report' },
              { id: 'daily', label: 'Daily Collection' },
              { id: 'range', label: 'Date Range' },
              { id: 'scholarship', label: 'Scholarship Report' }
            ].map(sub => (
              <button
                key={sub.id}
                onClick={() => {
                  setActiveReportSubTab(sub.id);
                  setReportData([]);
                  setReportTotalSum(0);
                }}
                className={`px-4 py-2 font-bold rounded-lg text-xs transition ${
                  activeReportSubTab === sub.id
                    ? 'bg-schoolGreen text-white'
                    : 'bg-gray-150 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* Filters card */}
          <Card>
            <div className="flex flex-wrap gap-4 items-end justify-between">
              <div className="flex flex-wrap gap-4 items-end">
                {/* Year filter */}
                {['pending', 'payments', 'scholarship'].includes(activeReportSubTab) && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Academic Year</label>
                    <select
                      value={repYearId}
                      onChange={e => setRepYearId(e.target.value)}
                      className="p-2 border rounded-xl outline-none font-bold text-gray-700"
                    >
                      {academicYears.map(y => <option key={y.year_id} value={y.year_id.toString()}>{y.year_name}</option>)}
                    </select>
                  </div>
                )}

                {/* Class filter */}
                {['pending', 'payments', 'scholarship'].includes(activeReportSubTab) && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Class</label>
                    <select
                      value={repClass}
                      onChange={e => setRepClass(e.target.value)}
                      className="p-2 border rounded-xl outline-none font-bold text-gray-700"
                    >
                      <option value="">All Classes</option>
                      {classesList.map(c => <option key={c} value={c}>Class {c}</option>)}
                    </select>
                  </div>
                )}

                {/* Term filter */}
                {['pending', 'payments'].includes(activeReportSubTab) && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Term</label>
                    <select
                      value={repTermId}
                      onChange={e => setRepTermId(e.target.value)}
                      className="p-2 border rounded-xl outline-none font-bold text-gray-700"
                    >
                      <option value="">All Terms</option>
                      {terms.map(t => <option key={t.term_id} value={t.term_id.toString()}>{getTermLabel(t.term_name, repClass)}</option>)}
                    </select>
                  </div>
                )}

                {/* Mode filter */}
                {['payments', 'daily', 'range'].includes(activeReportSubTab) && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Payment Mode</label>
                    <select
                      value={repMode}
                      onChange={e => setRepMode(e.target.value)}
                      className="p-2 border rounded-xl outline-none font-bold text-gray-700"
                    >
                      <option value="">All Modes</option>
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                      <option value="Scholarship">Scholarship</option>
                    </select>
                  </div>
                )}

                {/* Daily date filter */}
                {activeReportSubTab === 'daily' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Select Date</label>
                    <input
                      type="date"
                      value={repDailyDate}
                      onChange={e => setRepDailyDate(e.target.value)}
                      className="p-2 border rounded-xl outline-none font-bold text-gray-700"
                    />
                  </div>
                )}

                {/* Range date filter */}
                {activeReportSubTab === 'range' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Start Date</label>
                      <input
                        type="date"
                        value={repStartDate}
                        onChange={e => setRepStartDate(e.target.value)}
                        className="p-2 border rounded-xl outline-none font-bold text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">End Date</label>
                      <input
                        type="date"
                        value={repEndDate}
                        onChange={e => setRepEndDate(e.target.value)}
                        className="p-2 border rounded-xl outline-none font-bold text-gray-700"
                      />
                    </div>
                  </>
                )}

                <button
                  onClick={handleGenerateReport}
                  disabled={loading}
                  className="px-4 py-2 bg-schoolGreen text-white font-bold rounded-xl hover:bg-opacity-95 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {loading ? 'Generating...' : 'Generate Report'}
                </button>
              </div>

              <button
                onClick={handleExportCSV}
                disabled={reportData.length === 0}
                className="px-4 py-2 bg-green-50 border border-green-250 text-schoolGreen font-bold rounded-xl hover:bg-green-100 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>
          </Card>

          {/* Daily summaries if applicable */}
          {['daily', 'range'].includes(activeReportSubTab) && reportDailySummary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: '💵 Cash Total', amt: reportDailySummary.Cash, color: 'text-emerald-700' },
                { label: '📱 UPI Total', amt: reportDailySummary.UPI, color: 'text-indigo-700' },
                { label: '💳 Card Total', amt: reportDailySummary.Card, color: 'text-blue-700' },
                { label: '🏦 Grand Total', amt: reportDailySummary.grand_total, color: 'text-schoolGreen' }
              ].map((card, idx) => (
                <Card key={idx} highlight>
                  <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">{card.label}</span>
                  <span className={`text-2xl font-black mt-2 block ${card.color}`}>₹{card.amt.toLocaleString()}</span>
                </Card>
              ))}
            </div>
          )}

          {/* Data table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                {activeReportSubTab === 'pending' && (
                  <>
                    <thead>
                      <tr className="border-b text-[10px] text-gray-400 uppercase font-bold">
                        <th className="py-2.5 text-left pr-4 min-w-[150px]">Student Name</th>
                        <th className="py-2.5 text-left pr-4 min-w-[80px]">Roll No</th>
                        <th className="py-2.5 text-left pr-4 min-w-[80px]">Class</th>
                        <th className="py-2.5 text-left pr-4 min-w-[80px]">Year</th>
                        <th className="py-2.5 text-left pr-4 min-w-[150px]">Term</th>
                        <th className="py-2.5 text-left pr-4 min-w-[120px]">Category</th>
                        <th className="py-2.5 text-right pr-4 min-w-[100px]">Total Fee</th>
                        <th className="py-2.5 text-right pr-4 min-w-[100px]">Paid</th>
                        <th className="py-2.5 text-right pr-4 min-w-[100px]">Pending</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="9" className="py-12 text-center italic text-gray-400">Loading report...</td></tr>
                      ) : reportData.length === 0 ? (
                        <tr><td colSpan="9" className="py-12 text-center text-gray-400 italic">No records found</td></tr>
                      ) : (
                        reportData.map((r, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50/50">
                            <td className="py-3 font-bold text-gray-900 pr-4">{r.student_name}</td>
                            <td className="py-3 font-semibold text-gray-500 pr-4">{r.roll_no}</td>
                            <td className="py-3 font-semibold text-gray-700 pr-4">Class {r.school_class}</td>
                            <td className="py-3 text-gray-650 pr-4">{r.year_name}</td>
                            <td className="py-3 text-gray-650 pr-4">{getTermLabel(r.term_name, r.school_class)}</td>
                            <td className="py-3 font-bold text-gray-800 pr-4">{r.category_name}</td>
                            <td className="py-3 text-right pr-4">₹{r.total_fee.toLocaleString()}</td>
                            <td className="py-3 text-right text-green-600 font-semibold pr-4">₹{r.paid.toLocaleString()}</td>
                            <td className="py-3 text-right font-black text-red-650 pr-4">₹{r.pending.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                      <tr className="font-black bg-gray-50/50 text-right border-t">
                        <td colSpan="8" className="py-3">Total Pending Amount:</td>
                        <td className="py-3 text-red-650">₹{reportTotalSum.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </>
                )}

                {['payments', 'daily', 'range'].includes(activeReportSubTab) && (
                  <>
                    <thead>
                      <tr className="border-b text-[10px] text-gray-400 uppercase font-bold">
                        <th className="py-2.5 text-left pr-4 min-w-[120px]">Receipt No</th>
                        <th className="py-2.5 text-left pr-4 min-w-[110px]">Date</th>
                        <th className="py-2.5 text-left pr-4 min-w-[150px]">Student Name</th>
                        <th className="py-2.5 text-left pr-4 min-w-[80px]">Roll No</th>
                        <th className="py-2.5 text-left pr-4 min-w-[90px]">Class</th>
                        <th className="py-2.5 text-left pr-4 min-w-[150px]">Term</th>
                        <th className="py-2.5 text-left pr-4 min-w-[120px]">Category</th>
                        <th className="py-2.5 text-right pr-4 min-w-[110px]">Amount Paid</th>
                        <th className="py-2.5 text-left pl-4 min-w-[80px]">Mode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="9" className="py-12 text-center italic text-gray-400">Loading report...</td></tr>
                      ) : reportData.length === 0 ? (
                        <tr><td colSpan="9" className="py-12 text-center text-gray-400 italic">No records found</td></tr>
                      ) : (
                        reportData.map((r, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50/50">
                            <td className="py-3 font-semibold text-gray-700 pr-4">{r.receipt_no}</td>
                            <td className="py-3 text-gray-650 pr-4">{new Date(r.payment_date).toLocaleDateString()}</td>
                            <td className="py-3 font-bold text-gray-900 pr-4">{r.student_name}</td>
                            <td className="py-3 font-semibold text-gray-500 pr-4">{r.roll_no}</td>
                            <td className="py-3 font-semibold text-gray-700 pr-4">Class {r.school_class}</td>
                            <td className="py-3 text-gray-650 pr-4">{getTermLabel(r.term_name, r.school_class)}</td>
                            <td className="py-3 font-bold text-gray-800 pr-4">{r.category_name}</td>
                            <td className="py-3 text-right text-green-600 font-semibold pr-4">₹{r.amount_paid.toLocaleString()}</td>
                            <td className="py-3 text-left pl-4 font-semibold text-gray-650">{r.payment_mode}</td>
                          </tr>
                        ))
                      )}
                      <tr className="font-black bg-gray-50/50 text-right border-t">
                        <td colSpan="7" className="py-3">Total Collection:</td>
                        <td className="py-3 text-green-600">₹{reportTotalSum.toLocaleString()}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </>
                )}

                {activeReportSubTab === 'scholarship' && (
                  <>
                    <thead>
                      <tr className="border-b text-[10px] text-gray-400 uppercase font-bold">
                        <th className="py-2.5 text-left pr-4 min-w-[150px]">Student Name</th>
                        <th className="py-2.5 text-left pr-4 min-w-[80px]">Roll No</th>
                        <th className="py-2.5 text-left pr-4 min-w-[80px]">Class</th>
                        <th className="py-2.5 text-left pr-4 min-w-[160px]">Scholarship Name</th>
                        <th className="py-2.5 text-left pr-4 min-w-[100px]">Year</th>
                        <th className="py-2.5 text-right pr-4 min-w-[100px]">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="6" className="py-12 text-center italic text-gray-400">Loading report...</td></tr>
                      ) : reportData.length === 0 ? (
                        <tr><td colSpan="6" className="py-12 text-center text-gray-400 italic">No records found</td></tr>
                      ) : (
                        reportData.map((r, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50/50">
                            <td className="py-3 font-bold text-gray-900 pr-4">{r.student_name}</td>
                            <td className="py-3 font-semibold text-gray-500 pr-4">{r.roll_no}</td>
                            <td className="py-3 font-semibold text-gray-700 pr-4">Class {r.school_class}</td>
                            <td className="py-3 font-bold text-gray-800 pr-4">{r.scholarship_name}</td>
                            <td className="py-3 text-gray-650 pr-4">{r.year_name}</td>
                            <td className="py-3 text-right font-bold text-gray-900 pr-4">₹{r.amount.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                      <tr className="font-black bg-gray-50/50 text-right border-t">
                        <td colSpan="5" className="py-3">Total Scholarships Posted:</td>
                        <td className="py-3 text-schoolGreen">₹{reportTotalSum.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </>
                )}
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
