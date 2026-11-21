import Swal from "sweetalert2";

// Modern Toast Notification
export const showToast = {
  success: (title) =>
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      customClass: {
        popup: "rounded-2xl shadow-lg border border-emerald-100 font-sans text-xs",
      },
    }),
  error: (title) =>
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "error",
      title,
      showConfirmButton: false,
      timer: 3500,
      timerProgressBar: true,
      customClass: {
        popup: "rounded-2xl shadow-lg border border-red-100 font-sans text-xs",
      },
    }),
};

// Modern Modal Alerts
export const showAlert = {
  success: (title, text = "") =>
    Swal.fire({
      icon: "success",
      title,
      text,
      confirmButtonText: "Done",
      confirmButtonColor: "#173b69",
      customClass: {
        popup: "rounded-3xl shadow-2xl p-6 font-sans",
        title: "text-lg font-black text-slate-800",
        htmlContainer: "text-xs text-slate-600 leading-relaxed",
        confirmButton: "rounded-xl px-5 py-2.5 text-xs font-bold shadow-md",
      },
    }),

  error: (title, text = "") =>
    Swal.fire({
      icon: "error",
      title,
      text,
      confirmButtonText: "Okay",
      confirmButtonColor: "#dc2626",
      customClass: {
        popup: "rounded-3xl shadow-2xl p-6 font-sans",
        title: "text-lg font-black text-slate-800",
        htmlContainer: "text-xs text-slate-600 leading-relaxed",
        confirmButton: "rounded-xl px-5 py-2.5 text-xs font-bold shadow-md",
      },
    }),

  warning: (title, text = "") =>
    Swal.fire({
      icon: "warning",
      title,
      text,
      confirmButtonText: "Got it",
      confirmButtonColor: "#f59e0b",
      customClass: {
        popup: "rounded-3xl shadow-2xl p-6 font-sans",
        title: "text-lg font-black text-slate-800",
        htmlContainer: "text-xs text-slate-600 leading-relaxed",
        confirmButton: "rounded-xl px-5 py-2.5 text-xs font-bold shadow-md",
      },
    }),

  info: (title, text = "") =>
    Swal.fire({
      icon: "info",
      title,
      text,
      confirmButtonText: "Understood",
      confirmButtonColor: "#173b69",
      customClass: {
        popup: "rounded-3xl shadow-2xl p-6 font-sans",
        title: "text-lg font-black text-slate-800",
        htmlContainer: "text-xs text-slate-600 leading-relaxed",
        confirmButton: "rounded-xl px-5 py-2.5 text-xs font-bold shadow-md",
      },
    }),
};

// Confirmation Dialog for Deletions
export const showConfirmDelete = async (itemName = "this item") => {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: `You are about to delete "${itemName}". This action cannot be undone!`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#64748b",
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
    reverseButtons: true,
    customClass: {
      popup: "rounded-3xl shadow-2xl p-6 font-sans",
      title: "text-lg font-black text-slate-800",
      htmlContainer: "text-xs text-slate-600",
      confirmButton: "rounded-xl px-4 py-2 text-xs font-bold bg-red-600 shadow-md",
      cancelButton: "rounded-xl px-4 py-2 text-xs font-bold bg-slate-500 shadow-md",
    },
  });
  return result.isConfirmed;
};

export default Swal;
