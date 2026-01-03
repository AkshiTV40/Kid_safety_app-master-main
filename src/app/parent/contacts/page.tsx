"use client";

import { useEffect, useState } from 'react';

type Contact = { id: string; name: string; phone: string };

export default function ContactsPage(){
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(()=>{
    const raw = localStorage.getItem('parent_contacts');
    if(raw) setContacts(JSON.parse(raw));
  },[]);

  useEffect(()=>{
    localStorage.setItem('parent_contacts', JSON.stringify(contacts));
  },[contacts]);

  function addOrUpdate(){
    if(!name || !phone) return;
    if(editId){
      setContacts(c=>c.map(x=> x.id === editId ? { ...x, name, phone} : x));
      setEditId(null);
    } else {
      setContacts(c => [...c, { id: Date.now().toString(), name, phone }]);
    }
    setName(''); setPhone('');
  }

  function edit(c:Contact){ setName(c.name); setPhone(c.phone); setEditId(c.id); }
  function remove(id:string){ setContacts(c=>c.filter(x=>x.id!==id)); }

  return (
    <div>
      <h2 className="text-xl font-semibold">Contacts</h2>
      <div className="mt-4 grid gap-2">
        {contacts.map(c=> (
          <div key={c.id} className="p-3 bg-white rounded shadow-sm flex items-center justify-between">
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-sm text-gray-600">{c.phone}</div>
            </div>
            <div className="flex gap-2 items-center">
              <a className="text-blue-600" href={`tel:${c.phone}`}>Call</a>
              <a className="text-blue-600" href={`sms:${c.phone}`}>Message</a>
              <button className="text-sm text-gray-500" onClick={()=>edit(c)}>Edit</button>
              <button className="text-sm text-red-500" onClick={()=>remove(c.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white p-4 rounded shadow-sm">
        <h3 className="font-semibold">{editId ? 'Edit Contact' : 'Add Contact'}</h3>
        <div className="mt-3 grid gap-2">
          <input className="border p-2 rounded" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
          <input className="border p-2 rounded" placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} />
          <div className="flex gap-2">
            <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={addOrUpdate}>{editId ? 'Save' : 'Add'}</button>
            <button className="px-3 py-2 bg-gray-200 rounded" onClick={()=>{setName(''); setPhone(''); setEditId(null);}}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
