import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { name, email } = body

    console.log("NEW LEAD:", { name, email })

    return NextResponse.json({
      success: true,
      message: "Lead captured successfully",
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    )
  }
}