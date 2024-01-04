"use server";

import { readUserSession } from "@/lib/actions";
import { createSupabaseAdmin, createSupbaseServerClient } from "@/lib/supabase";
import { revalidatePath, unstable_noStore } from "next/cache";

export async function createMember(data: {
  name: string;
  role: "user" | "admin";
  status: "active" | "resigned";
  email: string;
  password: string;
  confirm: string;
}) {
  const { data: userSession } = await readUserSession();
  if (userSession.session?.user.user_metadata.role != "admin") {
    return { error: { message: "You are not allowed to do this!" } };
  }

  const supabase = await createSupabaseAdmin();

  const createResult = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true, //so don't have to confirm email
    user_metadata: {
      role: data.role,
    },
  });

  if (createResult.error?.message) {
    return createResult;
  }

  const memberResult = await supabase.from("member").insert({
    name: data.name,
    id: createResult.data.user?.id,
    email: data.email,
  });

  if (memberResult.error?.message) {
    return memberResult;
  }

  const permissionResult = await supabase.from("permission").insert({
    role: data.role,
    member_id: createResult.data.user?.id,
    status: data.status,
  });

  revalidatePath("/dashboard/members");
  return permissionResult;
}
export async function updateMemberBasicById(
  id: string,
  data: { name: string }
) {
  const supabase = await createSupbaseServerClient();

  const result = await supabase
    .from("member")
    .update({ name: data.name })
    .eq("id", id);

  revalidatePath("/dashboard/members");
  return result;
}

//this is kinda broken rn idk why - think its the meta data breaking it
//when try to log into account when changed to admin the table is empty, says 'role "admin" does not exist' in error message
export async function updateMemberAdvancedById(
  permission_id: string,
  user_id: string,
  data: {
    role: "admin" | "user";
    status: "active" | "resigned";
  }
) {
  const { data: userSession } = await readUserSession();
  if (userSession.session?.user.user_metadata.role != "admin") {
    return { error: { message: "You are not allowed to do this!" } };
  }

  const supabaseAdmin = await createSupabaseAdmin();

  const updateResult = await supabaseAdmin.auth.admin.updateUserById(user_id, {
    role: data.role,
  });

  if (updateResult.error?.message) {
    return updateResult;
  }

  const supabase = await createSupbaseServerClient();

  const result = await supabase
    .from("permission")
    .update(data)
    .eq("id", permission_id);

  revalidatePath("/dashboard/members");
  return result;
}

export async function updateMemberAccountById(
  user_id: string,
  data: {
    email: string;
    password?: string | undefined;
    confirm?: string | undefined;
  }
) {
  const { data: userSession } = await readUserSession();
  if (userSession.session?.user.user_metadata.role != "admin") {
    return { error: { message: "You are not allowed to do this!" } };
  }

  let updateObject: {
    email: string;
    password?: string | undefined;
  } = { email: data.email };

  if (data.password) {
    updateObject["password"] = data.password;
  }

  const supabaseAdmin = await createSupabaseAdmin();

  const updateResult = await supabaseAdmin.auth.admin.updateUserById(
    user_id,
    updateObject
  );

  if (updateResult.error?.message) {
    return updateResult;
  }

  const supabase = await createSupbaseServerClient();
  const result = await supabase
    .from("member")
    .update({ email: data.email })
    .eq("id", user_id);
  revalidatePath("/dashboard/members");

  return result;
}

export async function deleteMemberById(user_id: string) {
  const { data: userSession } = await readUserSession();
  if (userSession.session?.user.user_metadata.role != "admin") {
    return { error: { message: "You are not allowed to do this!" } };
  }

  const supabaseAdmin = await createSupabaseAdmin();
  const deleteResult = await supabaseAdmin.auth.admin.deleteUser(user_id);

  if (deleteResult.error?.message) {
    return deleteResult;
  }

  const supabase = await createSupbaseServerClient();
  const result = await supabase.from("member").delete().eq("id", user_id);

  revalidatePath("/dashboard/members");
  return result;
}

export async function readMembers() {
  unstable_noStore();
  const supabase = await createSupbaseServerClient();

  const ret = await supabase.from("permission").select("*,member(*)");
  console.log(ret);
  return ret;
}
