import { EXTRACT_VALUES_PROMPT, MODEL } from '@/lib/constants'
import { ResumeSchema } from '@/lib/resume'
import { promises as fs } from 'node:fs'
import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import PDFParser from 'pdf2json'

const openai = new OpenAI()

export const runtime = 'nodejs'

function extractValues(resumeText: string): ReadableStream {
  console.log('Extract values from resume text:', resumeText)

  const stream = openai.beta.chat.completions.stream({
    model: MODEL,
    messages: [
      { role: 'system', content: EXTRACT_VALUES_PROMPT },
      { role: 'user', content: resumeText }
    ],
    response_format: zodResponseFormat(ResumeSchema, 'event')
  })

  const encoder = new TextEncoder()

  const readableStream = new ReadableStream({
    start(controller) {
      stream
        .on('content.delta', ({ parsed }) => {
          console.log('content.delta parsed:', parsed)
          // Send the parsed data as JSON
          controller.enqueue(encoder.encode(JSON.stringify(parsed) + '\n'))
        })
        .on('content.done', () => {
          console.log('content.done')
          controller.close()
        })
        .on('error', error => {
          console.error('Error in OpenAI stream:', error)
          controller.error(error)
        })
    }
  })

  return readableStream
}

async function parsePDF(uploadedFiles: FormDataEntryValue[]): Promise<string> {
  return new Promise((resolve, reject) => {
    if (uploadedFiles && uploadedFiles.length > 0) {
      const uploadedFile = uploadedFiles[0]
      if (uploadedFile instanceof File) {
        const tempFilePath = `/tmp/resume.pdf`

        uploadedFile.arrayBuffer().then(arrayBuffer => {
          const fileBuffer = Buffer.from(arrayBuffer)

          fs.writeFile(tempFilePath, fileBuffer)
            .then(() => {
              // Parse the pdf using pdf2json
              const pdfParser = new (PDFParser as any)(null, 1)

              pdfParser.on('pdfParser_dataError', (errData: any) => {
                console.log(errData.parserError)
                reject(errData.parserError)
              })

              pdfParser.on('pdfParser_dataReady', () => {
                const rawTextContent = (pdfParser as any).getRawTextContent()
                resolve(rawTextContent)
              })

              pdfParser.loadPDF(tempFilePath)
            })
            .catch(error => {
              console.error('Error writing file:', error)
              reject(error)
            })
        })
      } else {
        reject(new Error('Uploaded file is not of type File'))
      }
    } else {
      reject(new Error('No files uploaded'))
    }
  })
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const uploadedFiles = formData.getAll('files')
    console.log('Received files:', uploadedFiles)

    const resumeText = await parsePDF(uploadedFiles)
    console.log('Parsed resume text:', resumeText)

    const readableStream = extractValues(resumeText)

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Transfer-Encoding': 'chunked'
      }
    })
  } catch (error) {
    console.error('Error in POST handler:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process the PDF file' }),
      { status: 500 }
    )
  }
}
