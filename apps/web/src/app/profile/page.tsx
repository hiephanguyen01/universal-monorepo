"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";

import { api } from "../../lib/api";

export default function ProfilePage() {
  const queryClient =
    useQueryClient();

  const profileQuery =
    useQuery({
      queryKey: [
        "users",
        "me",
      ],
      queryFn:
        api.users.me,
      retry: false,
    });

  const [name, setName] =
    useState("");

  const updateProfile =
    useMutation({
      mutationFn: () => {
        const profile =
          profileQuery.data;

        if (!profile) {
          throw new Error(
            "User profile is not loaded",
          );
        }

        return api.users
          .updateMe({
            fullName:
              name,

            version:
              profile.version,
          });
      },

      onSuccess: (
        user,
      ) => {
        queryClient
          .setQueryData(
            [
              "users",
              "me",
            ],
            user,
          );

        setName("");
      },
    });

  return (
    <main className="container">
      <div className="card">
        <h1 className="text-2xl font-bold">
          Profile
        </h1>

        {profileQuery.isLoading && (
          <p>Loading...</p>
        )}

        {profileQuery.error && (
          <p className="error">
            {
              profileQuery
                .error
                .message
            }
          </p>
        )}

        {profileQuery.data && (
          <>
            <p>
              {
                profileQuery
                  .data
                  .email
              }
            </p>

            <p>
              {
                profileQuery
                  .data
                  .fullName
              }
            </p>

            <label className="field">
              New full name

              <input
                value={name}
                onChange={(
                  event,
                ) =>
                  setName(
                    event
                      .target
                      .value,
                  )
                }
              />
            </label>

            <button
              className="btn"
              onClick={() =>
                updateProfile
                  .mutate()
              }
              disabled={
                !name ||
                updateProfile
                  .isPending
              }
            >
              Update profile
            </button>

            {updateProfile.error && (
              <p className="error">
                {
                  updateProfile
                    .error
                    .message
                }
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
