import { CarWriter } from '@ipld/car'
import { importer } from 'ipfs-unixfs-importer'
import { MemoryBlockstore } from 'blockstore-core'

export async function getDocumentCID(file: File): Promise<string> {
  try {
    // Create a memory blockstore (no actual storage)
    const blockstore = new MemoryBlockstore()

    // Convert file to async iterable
    const fileIterable = async function* () {
      const buffer = new Uint8Array(await file.arrayBuffer())
      yield {
        path: file.name,
        content: buffer,
      }
    }

    // Import and get CID without storing
    const entries = importer(fileIterable(), blockstore, {
      cidVersion: 1,
      rawLeaves: true,
      wrapWithDirectory: false,
    })

    // Get the first (and only) entry
    for await (const entry of entries) {
      return entry.cid.toString()
    }

    throw new Error('Failed to generate CID')
  } catch (error) {
    console.error('Error generating CID:', error)
    throw error
  }
}
