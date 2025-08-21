import { useEffect, useRef, useState } from 'react'
import { api, setAuthToken } from '../lib/api'

type Course = { _id: string, code: string, title: string, department?: string, level?: string, published?: boolean, createdAt?: string }
type Tutorial = { _id: string, course?: string, subject?: string, title: string, description?: string, pdf?: any, published?: boolean, createdAt?: string }
type College = { _id: string, name: string, abbr?: string }
type Department = { _id: string, name: string, code?: string, college: string }
type Subject = { _id: string, title: string, code?: string, course: string }

export default function Tutorials() {
  // auth
  useEffect(() => {
    const token = localStorage.getItem('token') || ''
    if (!token) { window.location.href = '/login'; return }
    setAuthToken(token)
  }, [])

  // filters/pagination
  const [q, setQ] = useState('')
  const [published, setPublished] = useState<'all' | 'published' | 'unpublished'>('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  // courses state
  const [courses, setCourses] = useState<Course[]>([])
  const [coursesTotal, setCoursesTotal] = useState(0)
  const [coursesPages, setCoursesPages] = useState(1)
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [courseError, setCourseError] = useState<string | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  // tutorials state
  const [tutorials, setTutorials] = useState<Tutorial[]>([])
  const [tutTotal, setTutTotal] = useState(0)
  const [tutPages, setTutPages] = useState(1)
  const [loadingTuts, setLoadingTuts] = useState(false)
  const [tutError, setTutError] = useState<string | null>(null)

  // catalog cascading state
  const [colleges, setColleges] = useState<College[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [catalogCourses, setCatalogCourses] = useState<Course[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])

  const [collegeId, setCollegeId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [catalogCourseId, setCatalogCourseId] = useState('')
  const [subjectId, setSubjectId] = useState('')

  // course form
  const [editCourse, setEditCourse] = useState<Course | null>(null)
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [department, setDepartment] = useState('')
  const [level, setLevel] = useState('')
  const [description, setDescription] = useState('')

  // tutorial form
  const [editTut, setEditTut] = useState<Tutorial | null>(null)
  const [tTitle, setTTitle] = useState('')
  const [tDesc, setTDesc] = useState('')
  const pdfRef = useRef<HTMLInputElement | null>(null)

  // Fetch courses
  useEffect(() => { fetchCourses() }, [q, published, page, limit])

  async function fetchCourses() {
    setLoadingCourses(true); setCourseError(null)
    try {
      const params: any = { q: q || undefined, published: published === 'all' ? undefined : (published === 'published'), page, limit, sort: 'level code' }
      const res = await api.get('/api/tutorials/courses', { params })
      const data = res.data?.data ?? res.data
      if (Array.isArray(data)) {
        setCourses(data)
        setCoursesTotal(res.data?.pagination?.total ?? data.length)
        setCoursesPages(res.data?.pagination?.pages ?? 1)
        if (!selectedCourse && data.length > 0) setSelectedCourse(data[0])
      } else setCourseError('Unexpected response format for courses')
    } catch (e: any) {
      setCourseError(e?.response?.data?.message || 'Failed to load courses')
    } finally { setLoadingCourses(false) }
  }

  // Fetch tutorials: prefer subject if selected, else fallback to course
  useEffect(() => {
    if (subjectId) fetchTutorialsBySubject(subjectId)
    else if (selectedCourse) fetchTutorialsByCourse(selectedCourse._id)
  }, [subjectId, selectedCourse, q, published, page, limit])

  async function fetchTutorialsByCourse(courseId: string) {
    setLoadingTuts(true); setTutError(null)
    try {
      const params: any = { q: q || undefined, published: published === 'all' ? undefined : (published === 'published'), page, limit, sort: '-createdAt' }
      const res = await api.get(`/api/tutorials/${courseId}`, { params })
      const data = res.data?.data ?? res.data
      if (Array.isArray(data)) {
        setTutorials(data)
        setTutTotal(res.data?.pagination?.total ?? data.length)
        setTutPages(res.data?.pagination?.pages ?? 1)
      } else setTutError('Unexpected response format for tutorials')
    } catch (e: any) {
      setTutError(e?.response?.data?.message || 'Failed to load tutorials')
    } finally { setLoadingTuts(false) }
  }

  async function fetchTutorialsBySubject(subId: string) {
    setLoadingTuts(true); setTutError(null)
    try {
      const params: any = { q: q || undefined, published: published === 'all' ? undefined : (published === 'published'), page, limit, sort: '-createdAt' }
      const res = await api.get(`/api/tutorials/subject/${subId}`, { params })
      const data = res.data?.data ?? res.data
      if (Array.isArray(data)) {
        setTutorials(data)
        setTutTotal(res.data?.pagination?.total ?? data.length)
        setTutPages(res.data?.pagination?.pages ?? 1)
      } else setTutError('Unexpected response format for tutorials')
    } catch (e: any) {
      setTutError(e?.response?.data?.message || 'Failed to load tutorials')
    } finally { setLoadingTuts(false) }
  }

  // course helpers
  function resetCourseForm() { setEditCourse(null); setCode(''); setTitle(''); setDepartment(''); setLevel(''); setDescription('') }
  function startEditCourse(c: Course) { setEditCourse(c); setCode(c.code); setTitle(c.title); setDepartment(c.department || ''); setLevel(String(c.level || '')); setDescription('') }
  async function saveCourse() {
    try {
      if (!code || !title || !level || !department) { alert('code, title, level, department required'); return }
      if (editCourse) await api.put(`/api/tutorials/courses/${editCourse._id}`, { code, title, level, department, description })
      else await api.post('/api/tutorials/courses', { code, title, level, department, description })
      resetCourseForm(); await fetchCourses()
    } catch (e: any) { setCourseError(e?.response?.data?.message || 'Failed to save course') }
  }
  async function toggleCoursePublish(c: Course, published: boolean) { try { await api.patch(`/api/tutorials/courses/${c._id}/publish`, { published }); await fetchCourses() } catch (e: any) { setCourseError(e?.response?.data?.message || 'Failed to update') } }
  async function deleteCourse(c: Course) { if (!confirm('Delete this course?')) return; try { await api.delete(`/api/tutorials/courses/${c._id}`); await fetchCourses() } catch (e: any) { setCourseError(e?.response?.data?.message || 'Failed to delete') } }

  // tutorial helpers
  function resetTutForm() { setEditTut(null); setTTitle(''); setTDesc(''); if (pdfRef.current) pdfRef.current.value = '' }
  function startEditTut(t: Tutorial) { setEditTut(t); setTTitle(t.title); setTDesc(t.description || '') }
  async function saveTutorial() {
    // Prefer subject upload; fallback to legacy course
    if (!subjectId && !selectedCourse) { alert('Select a subject (or legacy course) first'); return }
    try {
      if (editTut) {
        await api.put(`/api/tutorials/file/${editTut._id}`, { title: tTitle, description: tDesc })
      } else {
        // create with PDF upload
        const form = new FormData()
        form.append('title', tTitle)
        form.append('description', tDesc)
        if (!pdfRef.current || !pdfRef.current.files || pdfRef.current.files.length === 0) { alert('Select a PDF to upload'); return }
        form.append('pdf', pdfRef.current.files[0])
        if (subjectId) await api.post(`/api/tutorials/subject/${subjectId}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
        else await api.post(`/api/tutorials/${selectedCourse!._id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      resetTutForm(); if (subjectId) await fetchTutorialsBySubject(subjectId); else if (selectedCourse) await fetchTutorialsByCourse(selectedCourse._id)
    } catch (e: any) { setTutError(e?.response?.data?.message || 'Failed to save tutorial') }
  }
  async function toggleTutPublish(t: Tutorial, published: boolean) { try { await api.patch(`/api/tutorials/file/${t._id}/publish`, { published }); if (subjectId) await fetchTutorialsBySubject(subjectId); else if (selectedCourse) await fetchTutorialsByCourse(selectedCourse._id) } catch (e: any) { setTutError(e?.response?.data?.message || 'Failed to update') } }
  async function deleteTutorial(t: Tutorial) { if (!confirm('Delete this tutorial?')) return; try { await api.delete(`/api/tutorials/file/${t._id}`); if (subjectId) await fetchTutorialsBySubject(subjectId); else if (selectedCourse) await fetchTutorialsByCourse(selectedCourse._id) } catch (e: any) { setTutError(e?.response?.data?.message || 'Failed to delete') } }

  // Fetch catalog cascading lists
  useEffect(() => { fetchColleges() }, [])
  async function fetchColleges() {
    try {
      const res = await api.get('/api/catalog/colleges')
      setColleges(res.data?.data ?? res.data ?? [])
    } catch {}
  }
  useEffect(() => { if (collegeId) { setDepartments([]); setDepartmentId(''); setCatalogCourses([]); setCatalogCourseId(''); setSubjects([]); setSubjectId(''); fetchDepartments(collegeId) } }, [collegeId])
  async function fetchDepartments(cid: string) {
    try {
      const res = await api.get('/api/catalog/departments', { params: { college: cid } })
      setDepartments(res.data?.data ?? res.data ?? [])
    } catch {}
  }
  useEffect(() => { if (departmentId) { setCatalogCourses([]); setCatalogCourseId(''); setSubjects([]); setSubjectId(''); fetchCatalogCourses(departmentId) } }, [departmentId])
  async function fetchCatalogCourses(did: string) {
    try {
      const res = await api.get('/api/catalog/courses', { params: { department: did } })
      setCatalogCourses(res.data?.data ?? res.data ?? [])
    } catch {}
  }
  useEffect(() => { if (catalogCourseId) { setSubjects([]); setSubjectId(''); fetchSubjects(catalogCourseId) } }, [catalogCourseId])
  async function fetchSubjects(cid: string) {
    try {
      const res = await api.get('/api/catalog/subjects', { params: { course: cid } })
      setSubjects(res.data?.data ?? res.data ?? [])
    } catch {}
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Course & Tutorial Management</h1>
              <p className="text-gray-600 mt-1">Manage courses and their associated tutorial materials</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  className="block w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search courses or tutorials..."
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setPage(1) }}
                />
              </div>
              <div className="flex gap-2">
                <select
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={published}
                  onChange={(e) => { setPublished(e.target.value as any); setPage(1) }}
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="unpublished">Unpublished</option>
                </select>
                <select
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={limit}
                  onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Courses</h2>
              {courseError && (
                <div className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm">
                  {courseError}
                </div>
              )}
            </div>
          </div>

          {/* Course Form */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              {editCourse ? 'Edit Course' : 'Create New Course'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="CSC101"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Course Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Computer Science"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="100"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Course description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={saveCourse}
              >
                {editCourse ? 'Save Changes' : 'Create Course'}
              </button>
              {editCourse && (
                <button
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  onClick={resetCourseForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Courses List */}
          <div className="p-6">
            {loadingCourses ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No courses found. Create your first course to get started.
              </div>
            ) : (
              <>
                {/* Mobile Course Cards */}
                <div className="md:hidden space-y-4">
                  {courses.map((c) => (
                    <div key={c._id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{c.code} - {c.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{c.department} • Level {c.level}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {c.published ? 'Published' : 'Unpublished'}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedCourse(c)}
                          className="text-sm px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                        >
                          View Tutorials
                        </button>
                        <button
                          onClick={() => startEditCourse(c)}
                          className="text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                          Edit
                        </button>
                        {c.published ? (
                          <button
                            onClick={() => toggleCoursePublish(c, false)}
                            className="text-sm px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"
                          >
                            Unpublish
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleCoursePublish(c, true)}
                            className="text-sm px-3 py-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                          >
                            Publish
                          </button>
                        )}
                        <button
                          onClick={() => deleteCourse(c)}
                          className="text-sm px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Course Table */}
                <div className="hidden md:block overflow-hidden rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {courses.map((c) => (
                        <tr key={c._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.code}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{c.title}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{c.department || '—'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{c.level || '—'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {c.published ? 'Published' : 'Unpublished'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setSelectedCourse(c)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                View Tutorials
                              </button>
                              <button
                                onClick={() => startEditCourse(c)}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                Edit
                              </button>
                              {c.published ? (
                                <button
                                  onClick={() => toggleCoursePublish(c, false)}
                                  className="text-yellow-600 hover:text-yellow-900"
                                >
                                  Unpublish
                                </button>
                              ) : (
                                <button
                                  onClick={() => toggleCoursePublish(c, true)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Publish
                                </button>
                              )}
                              <button
                                onClick={() => deleteCourse(c)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {coursesTotal > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-2">
                    <div className="text-sm text-gray-700 mb-4 sm:mb-0">
                      Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, coursesTotal)}</span> of <span className="font-medium">{coursesTotal}</span> courses
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setPage(1)}
                        disabled={page === 1}
                        className="px-3 py-1.5 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        First
                      </button>
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-700">
                        Page {page} of {coursesPages}
                      </span>
                      <button
                        onClick={() => setPage(p => Math.min(coursesPages, p + 1))}
                        disabled={page === coursesPages}
                        className="px-3 py-1.5 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                      <button
                        onClick={() => setPage(coursesPages)}
                        disabled={page === coursesPages}
                        className="px-3 py-1.5 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Last
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Tutorials Section */}
        {selectedCourse && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Tutorials</h2>
                <p className="text-sm text-gray-600 mt-1">For {selectedCourse.code} - {selectedCourse.title}</p>
              </div>
              {tutError && (
                <div className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm">
                  {tutError}
                </div>
              )}
            </div>

            {/* Tutorial Form */}
            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                {editTut ? 'Edit Tutorial' : 'Upload New Tutorial'}
              </h3>
              {/* Cascading selectors (College -> Department -> Course -> Subject) */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
                  <select className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={collegeId} onChange={e => setCollegeId(e.target.value)}>
                    <option value="">Select college</option>
                    {colleges.map(c => (<option key={c._id} value={c._id}>{c.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={departmentId} onChange={e => setDepartmentId(e.target.value)} disabled={!collegeId}>
                    <option value="">Select department</option>
                    {departments.map(d => (<option key={d._id} value={d._id}>{d.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                  <select className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={catalogCourseId} onChange={e => setCatalogCourseId(e.target.value)} disabled={!departmentId}>
                    <option value="">Select course</option>
                    {catalogCourses.map(c => (<option key={c._id} value={c._id}>{c.code} - {c.title}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={subjectId} onChange={e => setSubjectId(e.target.value)} disabled={!catalogCourseId}>
                    <option value="">Select subject</option>
                    {subjects.map(s => (<option key={s._id} value={s._id}>{s.title}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tutorial Title"
                    value={tTitle}
                    onChange={(e) => setTTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tutorial description"
                    value={tDesc}
                    onChange={(e) => setTDesc(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PDF File</label>
                  <input
                    ref={pdfRef}
                    type="file"
                    accept="application/pdf"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={saveTutorial}
                >
                  {editTut ? 'Save Changes' : 'Upload Tutorial'}
                </button>
                {editTut && (
                  <button
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    onClick={resetTutForm}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Tutorials List */}
            <div className="p-6">
              {loadingTuts ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : tutorials.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No tutorials found for this course. Upload your first tutorial to get started.
                </div>
              ) : (
                <>
                  {/* Mobile Tutorial Cards */}
                  <div className="md:hidden space-y-4">
                    {tutorials.map((t) => (
                      <div key={t._id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900">{t.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {t.published ? 'Published' : 'Unpublished'}
                          </span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <a
                            href={t.pdf?.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                          >
                            View PDF
                          </a>
                          <button
                            onClick={() => startEditTut(t)}
                            className="text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                          >
                            Edit
                          </button>
                          {t.published ? (
                            <button
                              onClick={() => toggleTutPublish(t, false)}
                              className="text-sm px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"
                            >
                              Unpublish
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleTutPublish(t, true)}
                              className="text-sm px-3 py-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                            >
                              Publish
                            </button>
                          )}
                          <button
                            onClick={() => deleteTutorial(t)}
                            className="text-sm px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Tutorial Table */}
                  <div className="hidden md:block overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tutorials.map((t) => (
                          <tr key={t._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.title}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {t.published ? 'Published' : 'Unpublished'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <a
                                  href={t.pdf?.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  View PDF
                                </a>
                                <button
                                  onClick={() => startEditTut(t)}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  Edit
                                </button>
                                {t.published ? (
                                  <button
                                    onClick={() => toggleTutPublish(t, false)}
                                    className="text-yellow-600 hover:text-yellow-900"
                                  >
                                    Unpublish
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => toggleTutPublish(t, true)}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    Publish
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteTutorial(t)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {tutTotal > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-2">
                      <div className="text-sm text-gray-700 mb-4 sm:mb-0">
                        Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, tutTotal)}</span> of <span className="font-medium">{tutTotal}</span> tutorials
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setPage(1)}
                          disabled={page === 1}
                          className="px-3 py-1.5 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          First
                        </button>
                        <button
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="px-3 py-1.5 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-gray-700">
                          Page {page} of {tutPages}
                        </span>
                        <button
                          onClick={() => setPage(p => Math.min(tutPages, p + 1))}
                          disabled={page === tutPages}
                          className="px-3 py-1.5 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                        <button
                          onClick={() => setPage(tutPages)}
                          disabled={page === tutPages}
                          className="px-3 py-1.5 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Last
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}